import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { batchSize = 10, maxJobs = 100 } = await request.json()

    console.log(`🎯 Processing embedding jobs (batch: ${batchSize}, max: ${maxJobs})`)

    // Get pending jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('embedding_jobs')
      .select(`
        id,
        candidate_id,
        job_type,
        priority,
        created_at,
        candidates (
          id,
          full_name,
          source,
          bio_description,
          detailed_job_history,
          cv_parsed_text,
          current_title,
          current_company,
          headline,
          skills,
          employment_history
        )
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(Math.min(batchSize, maxJobs))

    if (jobsError) {
      console.error('Failed to fetch jobs:', jobsError)
      return Response.json({ success: false, error: jobsError.message }, { status: 500 })
    }

    if (!jobs?.length) {
      console.log('No pending jobs found')
      return Response.json({
        success: true,
        message: 'No pending jobs to process',
        processed: 0
      })
    }

    console.log(`📊 Found ${jobs.length} pending jobs to process`)

    let processed = 0
    let failed = 0

    // Process jobs in parallel batches
    const processBatch = async (batch: typeof jobs) => {
      const promises = batch.map(async (job) => {
        try {
          // Mark job as in progress
          await supabase
            .from('embedding_jobs')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', job.id)

          const candidate = job.candidates as any
          if (!candidate) {
            throw new Error('Candidate not found')
          }

          // Generate embedding content based on job type
          let content = ''
          
          if (job.job_type === 'profile') {
            // Comprehensive profile embedding
            const parts = [
              candidate.full_name,
              candidate.current_title,
              candidate.current_company,
              candidate.headline,
              candidate.bio_description,
              Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
              candidate.detailed_job_history,
              candidate.cv_parsed_text
            ].filter(Boolean)
            
            content = parts.join('\n\n')
          } else if (job.job_type === 'experience') {
            // Experience-focused embedding
            content = [
              candidate.detailed_job_history,
              candidate.employment_history,
              candidate.current_title,
              candidate.current_company
            ].filter(Boolean).join('\n\n')
          } else if (job.job_type === 'skills') {
            // Skills-focused embedding
            content = [
              Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
              candidate.headline,
              candidate.bio_description
            ].filter(Boolean).join('\n\n')
          }

          if (!content.trim()) {
            throw new Error('No content available for embedding')
          }

          // Generate embedding
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: content.substring(0, 8000), // Limit content length
            encoding_format: 'float'
          })

          const embedding = embeddingResponse.data[0].embedding

          // Store embedding
          await supabase
            .from('candidate_embeddings')
            .upsert({
              candidate_id: candidate.id,
              embedding_type: job.job_type,
              embedding: embedding,
              content_hash: Buffer.from(content).toString('base64').substring(0, 100),
              created_at: new Date().toISOString()
            }, {
              onConflict: 'candidate_id,embedding_type'
            })

          // Update candidate embedding status if this is a profile embedding
          if (job.job_type === 'profile') {
            await supabase
              .from('candidates')
              .update({ embedding_status: 'completed' })
              .eq('id', candidate.id)
          }

          // Mark job as completed
          await supabase
            .from('embedding_jobs')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              result: { embedding_dimensions: embedding.length }
            })
            .eq('id', job.id)

          console.log(`✅ Processed embedding for: ${candidate.full_name} [${candidate.source}]`)
          return { success: true, candidate: candidate.full_name }

        } catch (error) {
          console.error(`❌ Failed to process job ${job.id}:`, error)
          
          // Mark job as failed
          await supabase
            .from('embedding_jobs')
            .update({ 
              status: 'failed', 
              completed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', job.id)

          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      return Promise.all(promises)
    }

    // Process in smaller batches to avoid overwhelming the API
    const batchResults = []
    for (let i = 0; i < jobs.length; i += 5) {
      const batch = jobs.slice(i, i + 5)
      const results = await processBatch(batch)
      batchResults.push(...results)
      
      // Count results
      results.forEach(result => {
        if (result.success) {
          processed++
        } else {
          failed++
        }
      })

      // Rate limiting between batches
      if (i + 5 < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`🎉 Batch processing complete: ${processed} processed, ${failed} failed`)

    return Response.json({
      success: true,
      processed,
      failed,
      total: jobs.length,
      results: batchResults
    })

  } catch (error) {
    console.error('Error processing embedding jobs:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
