import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// POST /api/embed/cleanup-and-queue-missing - SMART cleanup and queue only missing embeddings
export async function POST(request: NextRequest) {
  try {
    logger.info('🧹 Starting SMART embedding cleanup and queue missing')

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = {
      duplicatesRemoved: 0,
      candidatesAlreadyEmbedded: 0,
      candidatesQueued: 0,
      errors: 0
    }

    // Step 1: Remove duplicate pending jobs (keep only the oldest one per candidate)
    logger.info('🔄 Step 1: Removing duplicate embedding jobs...')
    
    const { data: duplicateJobs, error: duplicateError } = await supabase.rpc('remove_duplicate_embedding_jobs')
    
    if (duplicateError) {
      // Fallback: manual cleanup
      const { data: duplicates } = await supabase
        .from('embedding_jobs')
        .select('id, candidate_id, created_at')
        .eq('status', 'pending')
        .order('candidate_id, created_at')

      if (duplicates) {
        const toDelete = []
        let lastCandidateId = null
        
        for (const job of duplicates) {
          if (job.candidate_id === lastCandidateId) {
            toDelete.push(job.id)
          } else {
            lastCandidateId = job.candidate_id
          }
        }

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('embedding_jobs')
            .delete()
            .in('id', toDelete)

          if (!deleteError) {
            results.duplicatesRemoved = toDelete.length
            logger.info({ removed: toDelete.length }, 'Removed duplicate jobs')
          }
        }
      }
    } else {
      results.duplicatesRemoved = duplicateJobs || 0
    }

    // Step 2: Get candidates that need embedding
    logger.info('🔄 Step 2: Finding candidates that need embedding...')
    
    const { data: candidatesNeedingEmbedding, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, loxo_id, embedding_status')
      .eq('source', 'loxo')
      .neq('embedding_status', 'completed')

    if (candidatesError) {
      throw candidatesError
    }

    logger.info({ count: candidatesNeedingEmbedding.length }, 'Found candidates needing embedding')

    // Step 3: Check which ones already have pending jobs
    const candidateIds = candidatesNeedingEmbedding.map(c => c.id)
    
    const { data: existingJobs, error: jobsError } = await supabase
      .from('embedding_jobs')
      .select('candidate_id')
      .eq('status', 'pending')
      .in('candidate_id', candidateIds)

    if (jobsError) {
      throw jobsError
    }

    const candidatesWithJobs = new Set(existingJobs.map(j => j.candidate_id))

    // Step 4: Queue missing candidates
    logger.info('🔄 Step 4: Queueing missing candidates...')
    
    const candidatesToQueue = candidatesNeedingEmbedding.filter(c => !candidatesWithJobs.has(c.id))
    
    if (candidatesToQueue.length > 0) {
      const jobsToInsert = candidatesToQueue.map(candidate => ({
        candidate_id: candidate.id,
        embedding_type: 'profile',
        status: 'pending',
        priority: 100,
        created_at: new Date().toISOString()
      }))

      // Insert in batches of 1000
      const batchSize = 1000
      for (let i = 0; i < jobsToInsert.length; i += batchSize) {
        const batch = jobsToInsert.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('embedding_jobs')
          .insert(batch)

        if (insertError) {
          logger.error({ error: insertError, batch: i / batchSize + 1 }, 'Failed to insert batch')
          results.errors++
        } else {
          results.candidatesQueued += batch.length
        }
      }

      // Update candidate embedding status to pending
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ embedding_status: 'pending' })
        .in('id', candidatesToQueue.map(c => c.id))
        .is('embedding_status', null)

      if (updateError) {
        logger.error({ error: updateError }, 'Failed to update candidate statuses')
      }
    }

    // Step 5: Final stats
    const { data: finalStats } = await supabase
      .from('embedding_jobs')
      .select('status')

    const finalCounts = {
      pending: finalStats?.filter(j => j.status === 'pending').length || 0,
      completed: finalStats?.filter(j => j.status === 'completed').length || 0,
      failed: finalStats?.filter(j => j.status === 'failed').length || 0
    }

    logger.info({ 
      results,
      finalCounts
    }, '🎉 SMART embedding cleanup completed')

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        finalCounts
      }
    })

  } catch (error) {
    logger.error({ error }, 'SMART embedding cleanup failed')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
