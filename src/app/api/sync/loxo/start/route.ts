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

            // Pre-write validation: require at least one reliable identifier
            const isValid = validateCandidate(candidateData)
            if (!isValid) {
              await supabase
                .from('scrape_run_items')
                .update({
                  processing_status: 'failed',
                  processing_notes: 'Validation failed: require email or phone or linkedin_url or (first_name+last_name and current_company)'
                })
                .eq('data_hash', dataHash)
                .eq('run_id', syncRunId)

              results.errors++
              continue
            }

            // Process through deduplication engine
            const result = await deduplicationEngine.processCandidate(candidateData)
            
            if (result.action === 'created') {
              results.created++
            } else {
              results.updated++
            }

            // Embedding optimization: queue only if profile content changed
            const profileHash = computeProfileProfileHash(result.candidate)
            const { data: existingEmbedding, error: embeddingCheckError } = await (supabase as any)
              .from('candidate_embeddings')
              .select('id')
              .eq('candidate_id', result.candidate.id)
              .eq('embedding_type', 'profile')
              .eq('content_hash', profileHash)
              .maybeSingle()

            if (!existingEmbedding && !embeddingCheckError) {
              await embeddingJobService.queueEmbeddingJob(result.candidate.id, 'profile', 150)
            }

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

            // Mark failed with reason
            try {
              await supabase
                .from('scrape_run_items')
                .update({
                  processing_status: 'failed',
                  processing_notes: error instanceof Error ? error.message : 'Unknown error'
                })
                .eq('run_id', syncRunId)
                .eq('data_hash', generateDataHash(contact))
            } catch (e) {
              log.warn({ e }, 'Failed to update scrape_run_item as failed')
            }
          }
        }

        log.info({ 
          scrollId,
          processed: results.processed,
          total: results.total 
        }, 'Sync progress')

        // Update last_sync_timestamp checkpoint based on last item in this page
        try {
          const last = contacts[contacts.length - 1]
          const lastUpdatedRaw = last?.updated_at || last?.updatedAt || null
          if (lastUpdatedRaw) {
            const lastUpdatedISO = new Date(lastUpdatedRaw).toISOString()
            await supabase
              .from('scrape_runs')
              .update({ last_sync_timestamp: lastUpdatedISO })
              .eq('id', syncRunId)
          }
        } catch (e) {
          log.warn({ e }, 'Failed to update last_sync_timestamp')
        }

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
  // Prefer nested raw fields when top-level are missing
  const raw = contact
  const rawEmail = Array.isArray(raw.emails) && raw.emails.length > 0 ? raw.emails[0]?.value : undefined
  const rawPhone = Array.isArray(raw.phones) && raw.phones.length > 0 ? raw.phones[0]?.value : undefined
  const [firstName, lastName] = splitFullName(raw.first_name, raw.last_name, raw.name)

  const normalizedEmail = normalizeEmail(raw.email || rawEmail)
  const normalizedPhone = normalizePhone(raw.phone || rawPhone)
  const linkedinUrl = normalizeUrl(raw.linkedin_url)

  return {
    source: 'loxo',
    external_id: raw.id?.toString(),
    loxo_id: raw.id?.toString(),
    loxo_contact_id: raw.contact_id,

    // Personal info (normalized)
    first_name: firstName || null,
    last_name: lastName || null,
    email: normalizedEmail || null,
    phone: normalizedPhone || null,
    linkedin_url: linkedinUrl || null,

    // Professional info
    current_title: raw.current_title || raw.title || null,
    current_company: raw.current_company || raw.company || null,
    headline: raw.headline || raw.summary || null,
    seniority_level: raw.seniority_level || null,
    years_experience: raw.years_experience || null,
    industry: raw.industry || null,

    // Location
    city: raw.city || null,
    state: raw.state || null,
    country: raw.country || null,

    // Loxo specific
    loxo_profile_score: raw.profile_score || null,
    loxo_tags: raw.tags || [],

    // Skills and qualifications
    skills: raw.skills || [],
    certifications: raw.certifications || [],
    education: raw.education ? JSON.parse(JSON.stringify(raw.education)) : null,
    employment_history: raw.work_history ? JSON.parse(JSON.stringify(raw.work_history)) : null,

    // Meta fields
    tags: raw.tags || [],
    priority: 'medium',
    status: 'active',
    contact_status: raw.status || 'new',
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

/**
 * Validate minimal candidate fields before writing
 */
function validateCandidate(c: CandidateInsert): boolean {
  const hasIdentity = !!(c.email || c.phone || c.linkedin_url || ((c.first_name || c.last_name) && c.current_company))
  return hasIdentity
}

/**
 * Compute a stable profile content hash to detect changes for embeddings
 */
function computeProfileProfileHash(candidate: any): string {
  const crypto = require('crypto')
  const parts = [
    candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
    candidate.current_title || '',
    candidate.current_company || '',
    Array.isArray(candidate.skills) ? candidate.skills.slice().sort() : [],
    candidate.headline || '',
    candidate.employment_history || null,
    candidate.cv_parsed_text || ''
  ]
  const stringified = JSON.stringify(parts)
  return crypto.createHash('sha256').update(stringified).digest('hex')
}

// Helpers
function splitFullName(first?: string | null, last?: string | null, fallbackName?: string | null): [string | null, string | null] {
  if (first || last) return [first || null, last || null]
  const name = (fallbackName || '').trim()
  if (!name) return [null, null]
  const parts = name.split(/\s+/)
  if (parts.length === 1) return [parts[0], null]
  const lastName = parts.pop() as string
  const firstName = parts.join(' ')
  return [firstName || null, lastName || null]
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null
  const e = String(email).trim().toLowerCase()
  return /.+@.+\..+/.test(e) ? e : null
}

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null
  // Keep digits and plus, naive E.164 cleanup
  const cleaned = String(phone).replace(/[^\d+]/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('+')) return cleaned
  // Assume NL if no country code; adjust as needed
  if (cleaned.startsWith('0')) return `+31${cleaned.slice(1)}`
  return `+31${cleaned}`
}

function normalizeUrl(url?: string | null): string | null {
  if (!url) return null
  const u = String(url).trim()
  return u || null
}