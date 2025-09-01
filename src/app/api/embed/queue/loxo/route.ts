import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embeddingJobService } from '@/lib/database/helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { onlyEnhanced = true, batchSize = 100 } = await request.json()
    
    console.log('🎯 Queueing embeddings for Loxo candidates...')

    // Get enhanced candidates that need embeddings
    let query = supabase
      .from('candidates')
      .select('id, full_name, bio_description, detailed_job_history, embedding_status')
      .eq('source', 'loxo')
      .neq('embedding_status', 'completed')

    if (onlyEnhanced) {
      // Only candidates with enhanced data
      query = query.or('bio_description.not.is.null,detailed_job_history.not.is.null')
    }

    const { data: candidates, error } = await query.limit(batchSize)

    if (error) {
      console.error('Failed to fetch candidates:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!candidates?.length) {
      return Response.json({ 
        success: true, 
        message: 'No candidates need embeddings',
        queued: 0 
      })
    }

    console.log(`📊 Found ${candidates.length} candidates needing embeddings`)

    // Queue embedding jobs for each candidate
    let queued = 0
    for (const candidate of candidates) {
      try {
        // Determine job type based on available data
        const hasEnhancedData = candidate.bio_description || candidate.detailed_job_history
        const jobType = hasEnhancedData ? 'profile' : 'full_reindex'
        
        await embeddingJobService.queueEmbeddingJob(candidate.id, jobType, 100)
        queued++
        
        console.log(`✅ Queued ${jobType} embedding for: ${candidate.full_name}`)
      } catch (error) {
        console.error(`❌ Failed to queue embedding for ${candidate.id}:`, error)
      }
    }

    // Update embedding status to pending
    await supabase
      .from('candidates')
      .update({ embedding_status: 'pending' })
      .in('id', candidates.map(c => c.id))

    console.log(`🎉 Successfully queued ${queued} embedding jobs`)

    return Response.json({
      success: true,
      message: `Queued ${queued} embedding jobs`,
      queued,
      total: candidates.length
    })

  } catch (error) {
    console.error('Error queueing embeddings:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
