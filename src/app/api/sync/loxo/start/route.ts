import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { deduplicationEngine } from '@/lib/database/deduplication'
import { embeddingJobService } from '@/lib/database/helpers'
import { loxoLogger } from '@/lib/logger'
import { CandidateInsert } from '@/types/database'

// POST /api/sync/loxo/start - Start Loxo database sync
export async function POST(request: NextRequest) {
  try {
    const {
      syncType = 'incremental',
      lastSyncTimestamp,
      batchSize = 500,
      options = {}
    } = await request.json()

    const {
      includeInactive = false,
      syncContacts = true,
      syncCompanies = true,
      syncJobs = false
    } = options
    
    if (!process.env.LOXO_API_KEY || !process.env.LOXO_API_URL || !process.env.LOXO_AGENCY_SLUG) {
      loxoLogger.error('Missing Loxo API configuration')
      return NextResponse.json(
        { success: false, error: 'Loxo API configuration missing' },
        { status: 500 }
      )
    }

    loxoLogger.info({ syncType, lastSyncTimestamp, batchSize }, 'Starting Loxo sync')

    const supabase = createServiceClient()

    // Create sync run record
    const { data: syncRun, error: runError } = await supabase
      .from('scrape_runs')
      .insert({
        source: 'loxo',
        run_type: syncType === 'full' ? 'full_sync' : 'incremental_sync',
        sync_type: syncType,
        last_sync_timestamp: lastSyncTimestamp,
        batch_size: batchSize,
        status: 'running',
        started_at: new Date().toISOString(),
        filters: {
          includeInactive,
          syncContacts,
          syncCompanies,
          syncJobs
        }
      })
      .select()
      .single()

    if (runError) {
      loxoLogger.error({ error: runError }, 'Failed to create sync run')
      return NextResponse.json(
        { success: false, error: 'Failed to create sync run' },
        { status: 500 }
      )
    }

    // Start background sync process
    processLoxoSync(syncRun.id, syncType, lastSyncTimestamp, batchSize, options)

    loxoLogger.info({ syncRunId: syncRun.id }, 'Loxo sync started successfully')

    return NextResponse.json({
      success: true,
      data: {
        syncRunId: syncRun.id,
        syncType,
        status: 'running',
        message: 'Loxo sync started successfully'
      }
    })

  } catch (error) {
    loxoLogger.error({ error }, 'Failed to start Loxo sync')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Background process for Loxo sync
 */
async function processLoxoSync(syncRunId: string, syncType: string, lastSyncTimestamp?: string, batchSize = 500, options: any = {}) {
  const supabase = createServiceClient()
  const log = loxoLogger.child({ syncRunId, syncType })
  
  try {
    log.info('Starting Loxo sync process')
    
    const results = {
      total: 0,
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0
    }

    let hasMore = true
    let scrollId: string | null = null

    while (hasMore) {
      try {
        // Build Loxo API URL with scroll-based pagination
        let apiUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people`
        
        if (scrollId) {
          apiUrl += `?scroll_id=${scrollId}`
        } else if (syncType === 'incremental' && lastSyncTimestamp) {
          apiUrl += `?updated_after=${lastSyncTimestamp}`
        }

        log.info({ apiUrl, scrollId, batchSize }, 'Making Loxo API request')

        // Fetch data from Loxo API
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          log.error({ 
            status: response.status, 
            statusText: response.statusText, 
            errorText,
            apiUrl 
          }, 'Loxo API request failed')
          throw new Error(`Loxo API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        log.info({ dataKeys: Object.keys(data), dataLength: data.people?.length }, 'Loxo API response received')
        const contacts = data.people || []
        
        if (!contacts.length) {
          hasMore = false
          break
        }

        // Update scroll_id for next page
        scrollId = data.scroll_id || null
        
        results.total += contacts.length

        // Process each contact
        for (const contact of contacts) {
          try {
            // Store raw sync data
            const dataHash = generateDataHash(contact)
            await supabase
              .from('scrape_run_items')
              .insert({
                run_id: syncRunId,
                raw_data: contact,
                data_hash: dataHash,
                processing_status: 'pending'
              })

            // Convert Loxo data to candidate format
            const candidateData = convertLoxoToCandidate(contact)

            // Process through deduplication engine
            const result = await deduplicationEngine.processCandidate(candidateData)
            
            if (result.action === 'created') {
              results.created++
            } else {
              results.updated++
            }

            // Queue embedding job
            await embeddingJobService.queueEmbeddingJob(result.candidate.id, 'profile', 150)

            // Update scrape run item status
            await supabase
              .from('scrape_run_items')
              .update({
                processing_status: 'processed',
                candidate_id: result.candidate.id,
                processed_at: new Date().toISOString()
              })
              .eq('data_hash', dataHash)
              .eq('run_id', syncRunId)

            results.processed++

          } catch (error) {
            results.errors++
            log.error({ error: error.message, stack: error.stack, contactId: contact.id }, 'Failed to process contact')
          }
        }

        log.info({ 
          scrollId,
          processed: results.processed,
          total: results.total 
        }, 'Sync progress')

        // Check if there are more pages
        hasMore = !!scrollId && contacts.length > 0

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100))

              } catch (error) {
          log.error({
            error: error.message,
            stack: error.stack,
            scrollId,
            apiUrl: `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people`
          }, 'Error processing Loxo sync page')
          hasMore = false
        }
    }

    // Update sync run with results
    await supabase
      .from('scrape_runs')
      .update({
        total_found: results.total,
        total_processed: results.processed,
        total_new: results.created,
        total_updated: results.updated,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - new Date().getTime()) / 1000)
      })
      .eq('id', syncRunId)

    log.info({ results }, 'Loxo sync completed successfully')

  } catch (error) {
    log.error({ error }, 'Loxo sync failed')
    
    // Update sync run with error
    await supabase
      .from('scrape_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', syncRunId)
  }
}

/**
 * Convert Loxo contact data to candidate format
 */
function convertLoxoToCandidate(contact: any): CandidateInsert {
  return {
    source: 'loxo',
    external_id: contact.id?.toString(),
    loxo_id: contact.id?.toString(),
    loxo_contact_id: contact.contact_id,
    
    // Personal info
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    linkedin_url: contact.linkedin_url,
    
    // Professional info
    current_title: contact.current_title || contact.title,
    current_company: contact.current_company || contact.company,
    headline: contact.headline || contact.summary,
    seniority_level: contact.seniority_level,
    years_experience: contact.years_experience,
    industry: contact.industry,
    
    // Location
    city: contact.city,
    state: contact.state,
    country: contact.country,
    
    // Loxo specific
    loxo_profile_score: contact.profile_score,
    loxo_tags: contact.tags || [],
    
    // Skills and qualifications
    skills: contact.skills || [],
    certifications: contact.certifications || [],
    education: contact.education ? JSON.parse(JSON.stringify(contact.education)) : null,
    employment_history: contact.work_history ? JSON.parse(JSON.stringify(contact.work_history)) : null,
    
    // Meta fields
    tags: contact.tags || [],
    priority: 'medium',
    status: 'active',
    contact_status: contact.status || 'new',
    embedding_status: 'pending',
    
    // Raw data
    loxo_raw_data: JSON.parse(JSON.stringify(contact))
  }
}

/**
 * Generate hash for deduplication
 */
function generateDataHash(data: any): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}