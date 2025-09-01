import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { embeddingJobService } from '@/lib/database/helpers'
import { GeminiService } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'

const geminiService = new GeminiService()

interface PipelineProgress {
  stage: 'sync' | 'enhance' | 'embed' | 'complete'
  processed: number
  total: number
  errors: number
  startTime: number
  currentBatch?: number
  totalBatches?: number
}

// POST /api/sync/loxo/full-pipeline - Complete Loxo to Vector pipeline
export async function POST(request: NextRequest) {
  try {
    const {
      maxCandidates = 15000,  // INCREASED: Get all Loxo candidates
      skipExisting = true,
      autoEmbed = true,
      batchSize = 100,        // INCREASED: More aggressive batching
      concurrency = 3         // INCREASED: More concurrent requests
    } = await request.json()

    logger.info({
      maxCandidates,
      skipExisting,
      autoEmbed,
      batchSize,
      concurrency
    }, '🚀 Starting OPTIMIZED full Loxo pipeline - ALL CANDIDATES')

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const progress: PipelineProgress = {
      stage: 'sync',
      processed: 0,
      total: maxCandidates,
      errors: 0,
      startTime: Date.now()
    }

    // STAGE 1: BULK SYNC WITH SMART ENHANCEMENT
    logger.info('🚀 Stage 1: Bulk sync with enhancement')
    
    const syncResults = await bulkSyncWithEnhancement(
      maxCandidates, 
      batchSize, 
      concurrency,
      skipExisting,
      supabase,
      progress
    )

    // STAGE 2: AUTO-EMBEDDING
    if (autoEmbed && syncResults.candidates.length > 0) {
      logger.info('🧠 Stage 2: Auto-embedding')
      progress.stage = 'embed'
      progress.processed = 0
      progress.total = syncResults.candidates.length

      await autoEmbedCandidates(syncResults.candidates, supabase, progress)
    }

    // COMPLETE
    progress.stage = 'complete'
    const totalTime = Date.now() - progress.startTime

    logger.info({
      totalTime: `${Math.round(totalTime / 1000)}s`,
      totalCandidates: syncResults.candidates.length,
      created: syncResults.created,
      updated: syncResults.updated,
      enhanced: syncResults.enhanced,
      embedded: autoEmbed ? syncResults.candidates.length : 0,
      errors: syncResults.errors
    }, '🎉 FULL PIPELINE COMPLETED - All Loxo candidates synced and embedded!')

    return NextResponse.json({
      success: true,
      data: {
        ...syncResults,
        totalTime,
        progress
      }
    })

  } catch (error) {
    logger.error({ error }, 'Full pipeline failed')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Pipeline failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Bulk sync with smart enhancement in parallel
 */
async function bulkSyncWithEnhancement(
  maxCandidates: number,
  batchSize: number,
  concurrency: number,
  skipExisting: boolean,
  supabase: any,
  progress: PipelineProgress
) {
  const results = {
    candidates: [] as any[],
    created: 0,
    updated: 0,
    enhanced: 0,
    errors: 0
  }

  // Get all Loxo contacts using existing API pattern
  logger.info('📥 Fetching ALL Loxo contacts...')
  const contacts = await fetchLoxoContacts(maxCandidates)

  progress.total = contacts.length
  progress.totalBatches = Math.ceil(contacts.length / batchSize)

  logger.info({
    totalContacts: contacts.length,
    totalBatches: progress.totalBatches,
    batchSize,
    concurrency
  }, '📊 Fetched contacts - starting batch processing')

  // Process in parallel batches
  const batches = chunkArray(contacts, batchSize)
  
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency)
    progress.currentBatch = i / concurrency + 1

    logger.info({
      currentBatch: progress.currentBatch,
      totalBatches: progress.totalBatches,
      processed: progress.processed,
      total: progress.total,
      progressPercent: Math.round((progress.processed / progress.total) * 100)
    }, `🔄 Processing batch ${progress.currentBatch}/${progress.totalBatches}`)

    const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
      return processBatchWithEnhancement(batch, supabase, skipExisting)
    })

    const batchResults = await Promise.allSettled(batchPromises)

    // Aggregate results with detailed tracking
    let batchCreated = 0, batchUpdated = 0, batchEnhanced = 0
    batchResults.forEach((result, batchIndex) => {
      if (result.status === 'fulfilled') {
        const batchResult = result.value
        results.candidates.push(...batchResult.candidates)
        results.created += batchResult.created
        results.updated += batchResult.updated
        results.enhanced += batchResult.enhanced
        progress.processed += batchResult.candidates.length

        batchCreated += batchResult.created
        batchUpdated += batchResult.updated
        batchEnhanced += batchResult.enhanced
      } else {
        results.errors++
        logger.error({ error: result.reason }, 'Batch processing failed')
      }
    })

    logger.info({
      batch: `${progress.currentBatch}/${progress.totalBatches}`,
      batchCreated,
      batchUpdated,
      batchEnhanced,
      processed: progress.processed,
      total: progress.total,
      progressPercent: Math.round((progress.processed / progress.total) * 100)
    }, `✅ Batch ${progress.currentBatch} completed - ${Math.round((progress.processed / progress.total) * 100)}% done`)

    // Rate limiting: 500ms between concurrent batches (OPTIMIZED for throughput)
    if (i + concurrency < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * Process batch with smart enhancement
 */
async function processBatchWithEnhancement(
  contacts: any[],
  supabase: any,
  skipExisting: boolean
) {
  const results = {
    candidates: [] as any[],
    created: 0,
    updated: 0,
    enhanced: 0
  }

  for (const contact of contacts) {
    try {
      // Check if exists and is FULLY processed (enhanced + embedded)
      if (skipExisting) {
        const { data: existing } = await supabase
          .from('candidates')
          .select('id, bio_description, detailed_job_history, embedding_status')
          .eq('loxo_id', contact.id)
          .single()

        // Only skip if FULLY enhanced AND embedded
        if (existing &&
            existing.bio_description &&
            existing.detailed_job_history &&
            existing.embedding_status === 'completed') {
          continue // Skip fully processed candidates
        }
      }

      // Get enhanced data immediately using existing API pattern
      const enhancedData = await fetchLoxoPersonDetails(contact.id)

      // Add delay between person detail requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Extract and parse Loxo contact data properly
      const fullName = contact.name || ''
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || null
      const lastName = nameParts.slice(1).join(' ') || null

      const primaryEmail = contact.emails?.[0]?.value || null
      const primaryPhone = contact.phones?.[0]?.value || null

      // Prepare candidate data with enhancement (NO full_name - it's generated!)
      const candidateData = {
        source: 'loxo',
        loxo_id: contact.id,
        first_name: firstName,
        last_name: lastName,
        // full_name is GENERATED - don't include it!
        email: primaryEmail,
        phone: primaryPhone,
        linkedin_url: contact.linkedin_url,
        current_title: contact.current_title,
        current_company: contact.current_company,
        headline: contact.headline,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        // Enhanced fields
        bio_description: enhancedData.description,
        detailed_job_history: enhancedData.employment_history,
        education_history: enhancedData.education_history,
        skills: enhancedData.skills || [],
        available_documents: enhancedData.resumes || [],
        loxo_raw_data: { ...contact, enhanced: enhancedData }
      }

      // Check if candidate exists first, then insert or update
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('loxo_id', contact.id)
        .single()

      let candidate
      if (existingCandidate) {
        // Update existing candidate
        const { data: updatedCandidate, error: updateError } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', existingCandidate.id)
          .select()
          .single()

        if (updateError) throw updateError
        candidate = updatedCandidate
        results.updated++
      } else {
        // Insert new candidate
        const { data: newCandidate, error: insertError } = await supabase
          .from('candidates')
          .insert(candidateData)
          .select()
          .single()

        if (insertError) throw insertError
        candidate = newCandidate
        results.created++
      }

      results.candidates.push(candidate)
      results.enhanced++

    } catch (error) {
      logger.error({ contactId: contact.id, error }, 'Failed to process contact')
    }
  }

  return results
}

/**
 * Auto-embed candidates
 */
async function autoEmbedCandidates(
  candidates: any[],
  supabase: any,
  progress: PipelineProgress
) {
  const batchSize = 100  // INCREASED: More aggressive embedding batching
  const batches = chunkArray(candidates, batchSize)

  for (const batch of batches) {
    const embedPromises = batch.map(async (candidate) => {
      try {
        // Queue embedding job with high priority
        await embeddingJobService.queueEmbeddingJob(
          candidate.id, 
          'full_reindex', 
          200 // High priority
        )
        progress.processed++
      } catch (error) {
        progress.errors++
        logger.error({ candidateId: candidate.id, error }, 'Failed to queue embedding')
      }
    })

    await Promise.allSettled(embedPromises)
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Fetch Loxo contacts using existing API pattern
 */
async function fetchLoxoContacts(maxCandidates: number) {
  const contacts = []
  let hasMore = true
  let scrollId: string | null = null
  let totalFetched = 0

  while (hasMore && totalFetched < maxCandidates) {
    let apiUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people`

    if (scrollId) {
      apiUrl += `?scroll_id=${scrollId}`
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Loxo API error: ${response.status}`)
    }

    const data = await response.json()
    const batchContacts = data.people || []

    if (!batchContacts.length) {
      hasMore = false
      break
    }

    contacts.push(...batchContacts.slice(0, maxCandidates - totalFetched))
    totalFetched += batchContacts.length
    scrollId = data.scroll_id || null
    hasMore = !!scrollId && totalFetched < maxCandidates

    // Rate limiting - OPTIMIZED for Loxo API limits
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return contacts
}

/**
 * Fetch enhanced person details using existing API pattern
 */
async function fetchLoxoPersonDetails(loxoId: string) {
  const apiUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${loxoId}`

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    logger.warn({ loxoId, status: response.status }, 'Failed to fetch person details')
    return {}
  }

  const data = await response.json()

  return {
    description: data.description,
    employment_history: data.job_profiles,
    education_history: data.education_profiles,
    skills: data.skills || [],
    resumes: data.resumes || []
  }
}

// GET /api/sync/loxo/full-pipeline - Get pipeline status
export async function GET() {
  // TODO: Implement real-time progress tracking
  return NextResponse.json({
    success: true,
    message: 'Pipeline status endpoint - TODO: implement WebSocket progress'
  })
}
