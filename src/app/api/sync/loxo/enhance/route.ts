import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { loxoLogger } from '@/lib/logger'
import { cvDownloader } from '@/lib/loxo/cv-downloader'

// POST /api/sync/loxo/enhance - Enhance existing Loxo candidates with detailed data
export async function POST(request: NextRequest) {
  try {
    const {
      batchSize = 50,         // ARCHON RECOMMENDED: Conservative batch size
      concurrency = 3,        // ARCHON RECOMMENDED: Max 2-3 concurrent (was too aggressive at 15)
      candidateIds = [],
      onlyMissing = true,
      downloadCVs = true
    } = await request.json()

    if (!process.env.LOXO_API_KEY || !process.env.LOXO_API_URL || !process.env.LOXO_AGENCY_SLUG) {
      loxoLogger.error('Missing Loxo API configuration')
      return NextResponse.json(
        { success: false, error: 'Loxo API configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()
    const log = loxoLogger.child({ endpoint: 'enhance', batchSize, concurrency })

    // Create enhancement run record
    const { data: enhancementRun, error: runError } = await supabase
      .from('scrape_runs')
      .insert({
        source: 'loxo',
        run_type: 'enhancement',
        status: 'running',
        batch_size: batchSize,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) {
      log.error({ error: runError }, 'Failed to create enhancement run')
      return NextResponse.json({ success: false, error: 'Failed to create enhancement run' }, { status: 500 })
    }

    log.info({ runId: enhancementRun.id }, 'Enhancement run started')

    // Get candidates that need enhancement
    let query = supabase
      .from('candidates')
      .select('id, loxo_id, first_name, last_name, bio_description, detailed_job_history, education_history, available_documents')
      .eq('source', 'loxo')
      .not('loxo_id', 'is', null)

    if (candidateIds.length > 0) {
      query = query.in('id', candidateIds)
    } else if (onlyMissing) {
      // Only enhance candidates missing enhanced data
      query = query.or('bio_description.is.null,detailed_job_history.is.null,education_history.is.null,available_documents.is.null')
    }

    const { data: candidates, error: candidatesError } = await query.limit(batchSize)

    if (candidatesError) {
      log.error({ error: candidatesError }, 'Failed to fetch candidates for enhancement')
      return NextResponse.json({ success: false, error: 'Failed to fetch candidates' }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      log.info('No candidates found for enhancement')
      await supabase
        .from('scrape_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_found: 0,
          total_processed: 0
        })
        .eq('id', enhancementRun.id)

      return NextResponse.json({
        success: true,
        data: {
          runId: enhancementRun.id,
          message: 'No candidates found for enhancement',
          processed: 0,
          total: 0
        }
      })
    }

    log.info({ candidateCount: candidates.length }, 'Found candidates for enhancement')

    // Process candidates in batches with concurrency control
    const results = {
      total: candidates.length,
      processed: 0,
      enhanced: 0,
      errors: 0,
      skipped: 0
    }

    // Process in chunks to respect rate limits
    const chunks = []
    for (let i = 0; i < candidates.length; i += concurrency) {
      chunks.push(candidates.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const promises = chunk.map(candidate => enhanceSingleCandidate(candidate, supabase, log, downloadCVs))
      const chunkResults = await Promise.allSettled(promises)

      chunkResults.forEach((result, index) => {
        results.processed++
        if (result.status === 'fulfilled') {
          if (result.value.enhanced) {
            results.enhanced++
          } else {
            results.skipped++
          }
        } else {
          results.errors++
          log.error({ 
            candidateId: chunk[index].id, 
            error: result.reason 
          }, 'Failed to enhance candidate')
        }
      })

      // ARCHON RECOMMENDED: Conservative 500ms delay (2 requests/second max)
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Update enhancement run with results
    await supabase
      .from('scrape_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_found: results.total,
        total_processed: results.processed,
        total_new: results.enhanced,
        total_updated: 0,
        duration_seconds: Math.floor((Date.now() - new Date(enhancementRun.started_at).getTime()) / 1000)
      })
      .eq('id', enhancementRun.id)

    log.info(results, 'Enhancement run completed')

    return NextResponse.json({
      success: true,
      data: {
        runId: enhancementRun.id,
        ...results
      }
    })

  } catch (error) {
    loxoLogger.error({ error }, 'Enhancement run failed')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Enhancement run failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Enhance a single candidate with detailed Loxo data
 */
async function enhanceSingleCandidate(candidate: any, supabase: any, log: any, downloadCVs: boolean = true) {
  try {
    if (!candidate.loxo_id) {
      log.warn({ candidateId: candidate.id }, 'Candidate missing loxo_id, skipping')
      return { enhanced: false, reason: 'missing_loxo_id' }
    }

    // Fetch detailed data from Loxo single person API
    const apiUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${candidate.loxo_id}`
    
    log.info({ candidateId: candidate.id, loxoId: candidate.loxo_id, apiUrl }, 'Fetching detailed candidate data')

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.LOXO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        log.warn({ candidateId: candidate.id, loxoId: candidate.loxo_id }, 'Candidate not found in Loxo')
        return { enhanced: false, reason: 'not_found' }
      }
      throw new Error(`Loxo API error: ${response.status} ${response.statusText}`)
    }

    const detailedData = await response.json()
    log.info({ candidateId: candidate.id, dataKeys: Object.keys(detailedData) }, 'Received detailed data')

    // Extract enhanced data
    const enhancedFields = extractEnhancedData(detailedData)

    // Only update if we have new data
    const hasNewData = Object.values(enhancedFields).some(value => value !== null && value !== undefined)
    
    if (!hasNewData) {
      log.info({ candidateId: candidate.id }, 'No new enhanced data found, skipping update')
      return { enhanced: false, reason: 'no_new_data' }
    }

    // Update candidate with enhanced data
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        ...enhancedFields,
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      })
      .eq('id', candidate.id)

    if (updateError) {
      throw new Error(`Failed to update candidate: ${updateError.message}`)
    }

    // Download CVs if requested and available
    let cvDownloaded = false
    if (downloadCVs && detailedData.resumes && Array.isArray(detailedData.resumes) && detailedData.resumes.length > 0) {
      try {
        const resume = detailedData.resumes[0] // Download first resume
        const cvResult = await cvDownloader.downloadCandidateCV(candidate.id, candidate.loxo_id, resume.id)
        if (cvResult.success) {
          cvDownloaded = true
          log.info({ candidateId: candidate.id, fileName: cvResult.fileName }, 'CV downloaded successfully')
        } else {
          log.warn({ candidateId: candidate.id, error: cvResult.error }, 'CV download failed')
        }
      } catch (cvError) {
        log.error({ candidateId: candidate.id, cvError }, 'CV download error')
      }
    }

    log.info({
      candidateId: candidate.id,
      enhancedFields: Object.keys(enhancedFields),
      cvDownloaded
    }, 'Candidate enhanced successfully')

    return {
      enhanced: true,
      fields: Object.keys(enhancedFields),
      cvDownloaded
    }

  } catch (error) {
    log.error({ candidateId: candidate.id, error }, 'Failed to enhance candidate')
    throw error
  }
}

/**
 * Extract enhanced data from detailed Loxo response
 */
function extractEnhancedData(data: any) {
  const enhanced: any = {}

  // Bio description
  if (data.description && typeof data.description === 'string' && data.description.trim()) {
    enhanced.bio_description = data.description.trim()
  }

  // Detailed job history from job_profiles
  if (data.job_profiles && Array.isArray(data.job_profiles) && data.job_profiles.length > 0) {
    enhanced.detailed_job_history = data.job_profiles.map((job: any) => ({
      id: job.id,
      title: job.title || job.position || null,
      company: job.company || job.employer || null,
      description: job.description || job.summary || null,
      start_date: job.start_date || job.started_at || null,
      end_date: job.end_date || job.ended_at || null,
      is_current: job.is_current || job.current || false,
      location: job.location || null,
      achievements: job.achievements || [],
      skills_used: job.skills || job.technologies || [],
      raw_data: job
    }))
  }

  // Education history from education_profiles  
  if (data.education_profiles && Array.isArray(data.education_profiles) && data.education_profiles.length > 0) {
    enhanced.education_history = data.education_profiles.map((edu: any) => ({
      id: edu.id,
      school: edu.school || edu.institution || edu.university || null,
      degree: edu.degree || edu.qualification || null,
      field_of_study: edu.field_of_study || edu.major || edu.subject || null,
      start_year: edu.start_year || edu.start_date || null,
      end_year: edu.end_year || edu.end_date || edu.graduation_year || null,
      grade: edu.grade || edu.gpa || null,
      description: edu.description || edu.activities || null,
      location: edu.location || null,
      raw_data: edu
    }))
  }

  // Available documents (resumes, etc.)
  if (data.resumes || data.documents) {
    const documents = []
    
    if (data.resumes && Array.isArray(data.resumes)) {
      documents.push(...data.resumes.map((resume: any) => ({
        type: 'resume',
        id: resume.id,
        name: resume.name || resume.filename || null,
        url: resume.url || null,
        file_size: resume.file_size || null,
        uploaded_at: resume.uploaded_at || resume.created_at || null,
        raw_data: resume
      })))
    }

    if (data.documents && Array.isArray(data.documents)) {
      documents.push(...data.documents.map((doc: any) => ({
        type: doc.type || 'document',
        id: doc.id,
        name: doc.name || doc.filename || null,
        url: doc.url || null,
        file_size: doc.file_size || null,
        uploaded_at: doc.uploaded_at || doc.created_at || null,
        raw_data: doc
      })))
    }

    if (documents.length > 0) {
      enhanced.available_documents = documents
    }
  }

  return enhanced
}
