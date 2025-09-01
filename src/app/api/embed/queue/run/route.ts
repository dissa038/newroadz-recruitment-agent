import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { candidateService, embeddingJobService } from '@/lib/database/helpers'
import { GeminiService } from '@/lib/ai/gemini'
import { embeddingLogger, createBatchLogger } from '@/lib/logger'

const geminiService = new GeminiService()

// Use service role client for consistent access
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/embed/queue/run - Process embedding jobs from the queue
export async function POST(request: NextRequest) {
  try {
    const { batchSize = 10, maxJobs = 500 } = await request.json()  // INCREASED: Process more jobs per run
    
    embeddingLogger.info({ batchSize, maxJobs }, 'Starting embedding queue processing')

    // Use service role client for consistent access
    const supabase = supabaseService

    // Get pending embedding jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(maxJobs)

    if (jobsError) {
      embeddingLogger.error({ error: jobsError }, 'Failed to fetch embedding jobs')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch embedding jobs' },
        { status: 500 }
      )
    }

    if (!jobs.length) {
      // DEBUG: Check if jobs exist but query doesn't find them
      const { data: debugJobs, error: debugError } = await supabase
        .from('embedding_jobs')
        .select('id, status, created_at')
        .limit(5)

      embeddingLogger.warn({
        debugJobs: debugJobs?.slice(0, 3),
        debugError,
        message: 'No pending embedding jobs found despite jobs existing in database'
      })

      return NextResponse.json({
        success: true,
        data: {
          processed: 0,
          succeeded: 0,
          failed: 0,
          message: 'No pending jobs to process'
        }
      })
    }

    const batchLogger = createBatchLogger('embedding_queue_processing', jobs.length)
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ jobId: string, error: string }>
    }

    // Process jobs in batches
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (job) => {
          try {
            await processEmbeddingJob(job, supabase)
            results.succeeded++
            batchLogger.logProgress(results.processed + 1, job)
          } catch (error) {
            results.failed++
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push({ jobId: job.id, error: errorMessage })
            batchLogger.logError(error as Error, job)
            
            // Update job status to failed
            await embeddingJobService.updateJobStatus(job.id, 'failed', errorMessage)
          }
          results.processed++
        })
      )

      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    batchLogger.complete(results.succeeded)

    embeddingLogger.info({ results }, 'Embedding queue processing completed')

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        totalJobs: jobs.length
      }
    })

  } catch (error) {
    embeddingLogger.error({ error }, 'Embedding queue processing failed')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process embedding queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Process a single embedding job
 */
async function processEmbeddingJob(job: any, supabase: any) {
  const jobLogger = embeddingLogger.child({ jobId: job.id, candidateId: job.candidate_id })
  
  try {
    // Update job status to in_progress
    await embeddingJobService.updateJobStatus(job.id, 'in_progress')
    
    jobLogger.info({ jobType: job.job_type }, 'Processing embedding job')

    // Get candidate data
    const candidate = await candidateService.getCandidateById(job.candidate_id)
    if (!candidate) {
      throw new Error('Candidate not found')
    }

    switch (job.job_type) {
      case 'profile':
        await processProfileEmbedding(candidate, supabase)
        break
      case 'cv_chunks':
        await processCVChunksEmbedding(candidate, supabase)
        break
      case 'full_reindex':
        await processFullReindex(candidate, supabase)
        break
      default:
        throw new Error(`Unknown job type: ${job.job_type}`)
    }

    // Mark candidate as embedded
    await candidateService.markCandidateEmbedded(candidate.id)
    
    // Update job status to completed
    await embeddingJobService.updateJobStatus(job.id, 'completed')
    
    jobLogger.info('Embedding job completed successfully')

  } catch (error) {
    jobLogger.error({ error }, 'Embedding job failed')
    throw error
  }
}

/**
 * Process profile embedding for a candidate
 */
async function processProfileEmbedding(candidate: any, supabase: any) {
  const embeddings = await geminiService.generateCandidateEmbedding(candidate)
  
  // Store profile embedding
  const profileText = buildCandidateProfileText(candidate)
  const contentHash = generateContentHash(profileText)
  
  await supabase
    .from('candidate_embeddings')
    .upsert({
      candidate_id: candidate.id,
      embedding_type: 'profile',
      content_hash: contentHash,
      source_text: profileText,
      embedding: embeddings.profileEmbedding
    }, {
      onConflict: 'candidate_id,embedding_type,content_hash'
    })

  // Store skills embedding if available
  if (embeddings.skillsEmbedding && candidate.skills?.length) {
    const skillsText = candidate.skills.join(', ')
    const skillsHash = generateContentHash(skillsText)
    
    await supabase
      .from('candidate_embeddings')
      .upsert({
        candidate_id: candidate.id,
        embedding_type: 'skills',
        content_hash: skillsHash,
        source_text: skillsText,
        embedding: embeddings.skillsEmbedding
      }, {
        onConflict: 'candidate_id,embedding_type,content_hash'
      })
  }

  // Store experience embedding if available
  if (embeddings.experienceEmbedding && candidate.employment_history) {
    const experienceText = buildExperienceText(candidate.employment_history)
    const experienceHash = generateContentHash(experienceText)
    
    await supabase
      .from('candidate_embeddings')
      .upsert({
        candidate_id: candidate.id,
        embedding_type: 'experience',
        content_hash: experienceHash,
        source_text: experienceText,
        embedding: embeddings.experienceEmbedding
      }, {
        onConflict: 'candidate_id,embedding_type,content_hash'
      })
  }
}

/**
 * Process CV chunks embedding
 */
async function processCVChunksEmbedding(candidate: any, supabase: any) {
  if (!candidate.cv_parsed_text) {
    return // No CV text to process
  }

  // Split CV text into chunks
  const chunks = splitTextIntoChunks(candidate.cv_parsed_text, 500)
  
  // Generate embeddings for each chunk
  const chunkEmbeddings = await geminiService.generateCVChunkEmbeddings(
    chunks.map((text, index) => ({
      text,
      type: categorizeChunk(text, index)
    }))
  )

  // Store chunk embeddings
  for (let i = 0; i < chunkEmbeddings.length; i++) {
    const chunk = chunkEmbeddings[i]
    const contentHash = generateContentHash(chunk.text)
    
    await supabase
      .from('candidate_embeddings')
      .upsert({
        candidate_id: candidate.id,
        embedding_type: 'cv_chunk',
        content_hash: contentHash,
        source_text: chunk.text,
        embedding: chunk.embedding,
        chunk_index: i,
        metadata: { type: chunk.type }
      }, {
        onConflict: 'candidate_id,embedding_type,content_hash'
      })
  }
}

/**
 * Process full reindex (both profile and CV)
 */
async function processFullReindex(candidate: any, supabase: any) {
  await processProfileEmbedding(candidate, supabase)
  if (candidate.cv_parsed_text) {
    await processCVChunksEmbedding(candidate, supabase)
  }
}

/**
 * Build candidate profile text for embedding
 */
function buildCandidateProfileText(candidate: any): string {
  const parts = []

  if (candidate.full_name) parts.push(`Name: ${candidate.full_name}`)
  if (candidate.current_title) parts.push(`Title: ${candidate.current_title}`)
  if (candidate.current_company) parts.push(`Company: ${candidate.current_company}`)
  if (candidate.headline) parts.push(`Headline: ${candidate.headline}`)
  if (candidate.industry) parts.push(`Industry: ${candidate.industry}`)
  if (candidate.city) parts.push(`Location: ${candidate.city}`)
  if (candidate.seniority_level) parts.push(`Seniority: ${candidate.seniority_level}`)
  if (candidate.skills?.length) parts.push(`Skills: ${candidate.skills.join(', ')}`)

  return parts.join('\n')
}

/**
 * Build experience text from employment history
 */
function buildExperienceText(employmentHistory: any): string {
  if (!employmentHistory || typeof employmentHistory !== 'object') {
    return ''
  }

  if (Array.isArray(employmentHistory)) {
    return employmentHistory.map(job => {
      return `${job.title || ''} at ${job.company || ''} - ${job.description || ''}`
    }).join('\n')
  }

  return JSON.stringify(employmentHistory)
}

/**
 * Split text into chunks of specified size
 */
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const words = text.split(' ')
  const chunks = []
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  
  return chunks
}

/**
 * Categorize text chunk based on content
 */
function categorizeChunk(text: string, index: number): string {
  const lowercaseText = text.toLowerCase()
  
  if (lowercaseText.includes('summary') || lowercaseText.includes('objective') || index === 0) {
    return 'summary'
  } else if (lowercaseText.includes('experience') || lowercaseText.includes('work') || lowercaseText.includes('employed')) {
    return 'experience'
  } else if (lowercaseText.includes('education') || lowercaseText.includes('degree') || lowercaseText.includes('university')) {
    return 'education'
  } else if (lowercaseText.includes('skill') || lowercaseText.includes('technology') || lowercaseText.includes('programming')) {
    return 'skills'
  } else {
    return 'other'
  }
}

/**
 * Generate content hash for deduplication
 */
function generateContentHash(content: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')
}