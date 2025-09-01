import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embeddingJobService } from '@/lib/database/helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      sources = ['loxo', 'apollo', 'cv_upload', 'manual'],
      onlyWithContent = true,
      batchSize = 200,
      priority = 100
    } = await request.json()
    
    console.log('🎯 Queueing universal embeddings for all sources...')

    // Build query for candidates needing embeddings
    let query = supabase
      .from('candidates')
      .select(`
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
        employment_history,
        embedding_status
      `)
      .in('source', sources)
      .neq('embedding_status', 'completed')

    if (onlyWithContent) {
      // Only candidates with meaningful content for embeddings
      query = query.or('bio_description.not.is.null,detailed_job_history.not.is.null,cv_parsed_text.not.is.null,headline.not.is.null,employment_history.not.is.null')
    }

    const { data: allCandidates, error } = await query.limit(batchSize)

    if (error) {
      console.error('Failed to fetch candidates:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!allCandidates?.length) {
      return Response.json({
        success: true,
        message: 'No candidates need embeddings',
        queued: 0
      })
    }

    // FILTER OUT candidates with pending jobs (POST-QUERY to avoid URI length issues)
    const { data: candidatesWithPendingJobs } = await supabase
      .from('embedding_jobs')
      .select('candidate_id')
      .eq('status', 'pending')

    const excludeIds = new Set(candidatesWithPendingJobs?.map(job => job.candidate_id) || [])
    const candidates = allCandidates.filter(candidate => !excludeIds.has(candidate.id))

    console.log(`🚫 Filtered out ${allCandidates.length - candidates.length} candidates with pending jobs`)

    if (!candidates.length) {
      return Response.json({
        success: true,
        message: 'All candidates already have pending embedding jobs',
        queued: 0
      })
    }

    console.log(`📊 Found ${candidates.length} candidates needing embeddings`)

    // Group by source for better insights
    const sourceStats = candidates.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('📈 Source breakdown:', sourceStats)

    // Queue embedding jobs with intelligent job type selection
    let queued = 0
    const results = {
      loxo: 0,
      apollo: 0,
      cv_upload: 0,
      manual: 0,
      total: 0
    }

    for (const candidate of candidates) {
      try {
        // Determine optimal job type based on available data and source
        const jobType = determineJobType(candidate)
        const jobPriority = determineJobPriority(candidate, priority)
        
        await embeddingJobService.queueEmbeddingJob(candidate.id, jobType, jobPriority)
        queued++
        results[candidate.source as keyof typeof results]++
        results.total++
        
        console.log(`✅ Queued ${jobType} embedding (priority: ${jobPriority}) for: ${candidate.full_name} [${candidate.source}]`)
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
    console.log('📊 Results by source:', results)

    return Response.json({
      success: true,
      message: `Queued ${queued} embedding jobs across ${sources.length} sources`,
      queued,
      total: candidates.length,
      sourceBreakdown: results,
      sources: sourceStats
    })

  } catch (error) {
    console.error('Error queueing universal embeddings:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

/**
 * Determine optimal job type based on candidate data and source
 */
function determineJobType(candidate: any): 'profile' | 'cv_chunks' | 'full_reindex' {
  // CV Upload candidates - prioritize CV chunks
  if (candidate.source === 'cv_upload' && candidate.cv_parsed_text) {
    return 'cv_chunks'
  }
  
  // Loxo candidates with enhanced data - full reindex for comprehensive embedding
  if (candidate.source === 'loxo' && (candidate.bio_description || candidate.detailed_job_history)) {
    return 'full_reindex'
  }
  
  // Apollo candidates - usually profile-based
  if (candidate.source === 'apollo') {
    return candidate.cv_parsed_text ? 'full_reindex' : 'profile'
  }
  
  // Manual candidates - depends on available data
  if (candidate.source === 'manual') {
    if (candidate.cv_parsed_text) return 'cv_chunks'
    if (candidate.employment_history) return 'full_reindex'
    return 'profile'
  }
  
  // Default fallback
  return 'profile'
}

/**
 * Determine job priority based on candidate quality and source
 */
function determineJobPriority(candidate: any, basePriority: number): number {
  let priority = basePriority
  
  // Higher priority for candidates with more data
  if (candidate.bio_description) priority += 20
  if (candidate.detailed_job_history) priority += 20
  if (candidate.cv_parsed_text) priority += 30
  if (candidate.employment_history) priority += 15
  if (candidate.skills?.length > 0) priority += 10
  
  // Source-based priority adjustments
  switch (candidate.source) {
    case 'cv_upload':
    case 'manual':
      priority += 50 // Highest priority - manually curated
      break
    case 'loxo':
      priority += 30 // High priority - enhanced data
      break
    case 'apollo':
      priority += 10 // Lower priority - basic scraping data
      break
  }
  
  return Math.min(priority, 999) // Cap at 999
}
