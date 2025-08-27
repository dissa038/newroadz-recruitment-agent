import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deduplicationEngine } from '@/lib/database/deduplication'
import { embeddingJobService } from '@/lib/database/helpers'
import { apolloLogger } from '@/lib/logger'
import { CandidateInsert } from '@/types/database'

// POST /api/scrape/apollo/webhook - Process Apollo scraping webhook from Apify
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      apolloLogger.warn({ webhookSecret }, 'Invalid webhook secret')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const webhookData = await request.json()
    const { actorRunId, status, people = [], metadata = {} } = webhookData

    apolloLogger.info({ 
      actorRunId, 
      status, 
      peopleCount: people.length,
      metadata 
    }, 'Apollo webhook received')

    const supabase = await createClient()

    // Update or create scrape run
    const { data: scrapeRun, error: runError } = await supabase
      .from('scrape_runs')
      .upsert({
        id: actorRunId,
        source: 'apollo',
        run_type: 'webhook',
        status: mapApifyStatusToScrapeStatus(status),
        total_found: people.length,
        actor_run_id: actorRunId,
        started_at: new Date().toISOString(),
        ...(status === 'SUCCEEDED' && { completed_at: new Date().toISOString() })
      })
      .select()
      .single()

    if (runError) {
      apolloLogger.error({ error: runError, actorRunId }, 'Failed to update scrape run')
      return NextResponse.json(
        { success: false, error: 'Failed to update scrape run' },
        { status: 500 }
      )
    }

    if (status !== 'SUCCEEDED' || !people.length) {
      apolloLogger.info({ actorRunId, status }, 'No candidates to process or run not completed')
      return NextResponse.json({ success: true, message: 'Webhook processed, no candidates to import' })
    }

    // Process candidates in batches
    const batchSize = 50
    const results = {
      total: people.length,
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      duplicates: 0
    }

    apolloLogger.info({ total: people.length, batchSize }, 'Starting candidate processing')

    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize)
      
      for (const person of batch) {
        try {
          // Store raw scrape data
          const dataHash = generateDataHash(person)
          await supabase
            .from('scrape_run_items')
            .insert({
              run_id: scrapeRun.id,
              raw_data: person,
              data_hash: dataHash,
              processing_status: 'pending'
            })

          // Convert Apollo data to candidate format
          const candidateData = convertApolloToCandidate(person)

          // Process through deduplication engine
          const result = await deduplicationEngine.processCandidate(candidateData)
          
          if (result.action === 'created') {
            results.created++
          } else {
            results.updated++
          }

          // Queue embedding job for new or updated candidates
          await embeddingJobService.queueEmbeddingJob(result.candidate.id, 'profile', 200)

          // Update scrape run item status
          await supabase
            .from('scrape_run_items')
            .update({
              processing_status: 'processed',
              candidate_id: result.candidate.id,
              processed_at: new Date().toISOString()
            })
            .eq('data_hash', dataHash)
            .eq('run_id', scrapeRun.id)

          results.processed++

          if (results.processed % 10 === 0) {
            apolloLogger.info({ 
              progress: `${results.processed}/${results.total}`,
              created: results.created,
              updated: results.updated 
            }, 'Processing progress')
          }

        } catch (error) {
          results.errors++
          apolloLogger.error({ 
            error, 
            personId: person.id,
            personEmail: person.email 
          }, 'Failed to process candidate')
        }
      }
    }

    // Update final scrape run results
    await supabase
      .from('scrape_runs')
      .update({
        total_processed: results.processed,
        total_new: results.created,
        total_updated: results.updated,
        total_duplicates: results.duplicates,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', scrapeRun.id)

    apolloLogger.info({ 
      actorRunId,
      results 
    }, 'Apollo webhook processing completed')

    return NextResponse.json({
      success: true,
      data: {
        scrapeRunId: scrapeRun.id,
        results
      }
    })

  } catch (error) {
    apolloLogger.error({ error }, 'Apollo webhook processing failed')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Convert Apollo person data to candidate format
 */
function convertApolloToCandidate(person: any): CandidateInsert {
  return {
    source: 'apollo',
    external_id: person.id,
    apollo_id: person.id,
    
    // Personal info
    first_name: person.first_name,
    last_name: person.last_name,
    email: person.email,
    phone: person.phone_numbers?.[0]?.raw_number,
    linkedin_url: person.linkedin_url,
    twitter_url: person.twitter_url,
    facebook_url: person.facebook_url,
    personal_website: person.personal_website,
    
    // Professional info
    current_title: person.title,
    current_company: person.organization?.name,
    current_company_id: person.organization?.id,
    headline: person.headline,
    seniority_level: person.seniority,
    industry: person.organization?.industry,
    
    // Location
    city: person.city,
    state: person.state,
    country: person.country,
    
    // Apollo specific
    apollo_organization_id: person.organization?.id,
    email_status: person.email_status,
    apollo_confidence_score: person.confidence,
    is_likely_to_engage: person.is_likely_to_engage,
    extrapolated_email_confidence: person.extrapolated_email_confidence,
    departments: person.departments,
    subdepartments: person.subdepartments,
    functions: person.functions,
    apollo_seniority: person.seniority,
    photo_url: person.photo_url,
    intent_strength: person.intent_strength,
    show_intent: person.show_intent,
    revealed_for_current_team: person.revealed_for_current_team,
    
    // Skills and education
    skills: person.skills || [],
    education: person.education ? JSON.parse(JSON.stringify(person.education)) : null,
    employment_history: person.employment_history ? JSON.parse(JSON.stringify(person.employment_history)) : null,
    
    // Meta fields
    tags: [],
    priority: 'medium',
    status: 'active',
    contact_status: 'new',
    embedding_status: 'pending',
    
    // Raw data
    apollo_raw_data: JSON.parse(JSON.stringify(person))
  }
}

/**
 * Map Apify status to scrape run status
 */
function mapApifyStatusToScrapeStatus(apifyStatus: string): string {
  switch (apifyStatus) {
    case 'RUNNING':
      return 'running'
    case 'SUCCEEDED':
      return 'completed'
    case 'FAILED':
    case 'TIMED-OUT':
    case 'ABORTED':
      return 'failed'
    default:
      return 'pending'
  }
}

/**
 * Generate hash for deduplication
 */
function generateDataHash(data: any): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}