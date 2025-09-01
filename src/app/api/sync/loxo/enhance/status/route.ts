import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { loxoLogger } from '@/lib/logger'

// GET /api/sync/loxo/enhance/status - Get enhancement status and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    const supabase = createServiceClient()
    const log = loxoLogger.child({ endpoint: 'enhance-status' })

    if (runId) {
      // Get specific enhancement run status
      const { data: enhancementRun, error: runError } = await supabase
        .from('scrape_runs')
        .select('*')
        .eq('id', runId)
        .eq('source', 'loxo')
        .eq('run_type', 'enhancement')
        .single()

      if (runError) {
        log.error({ error: runError, runId }, 'Enhancement run not found')
        return NextResponse.json(
          { success: false, error: 'Enhancement run not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          ...enhancementRun,
          runtime: enhancementRun.started_at 
            ? Math.floor((Date.now() - new Date(enhancementRun.started_at).getTime()) / 1000)
            : 0
        }
      })
    }

    // Get overall enhancement statistics
    const stats = await getEnhancementStats(supabase, log)
    
    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    loxoLogger.error({ error }, 'Failed to get enhancement status')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get enhancement status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get comprehensive enhancement statistics
 */
async function getEnhancementStats(supabase: any, log: any) {
  try {
    // Get total Loxo candidates
    const { count: totalLoxoCandidates, error: totalError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')

    if (totalError) {
      throw new Error(`Failed to get total candidates: ${totalError.message}`)
    }

    // Get candidates with enhanced data
    const { count: enhancedCandidates, error: enhancedError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .not('bio_description', 'is', null)

    if (enhancedError) {
      throw new Error(`Failed to get enhanced candidates: ${enhancedError.message}`)
    }

    // Get candidates with detailed job history
    const { count: detailedJobHistory, error: jobError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .not('detailed_job_history', 'is', null)

    if (jobError) {
      throw new Error(`Failed to get job history stats: ${jobError.message}`)
    }

    // Get candidates with education history
    const { count: educationHistory, error: eduError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .not('education_history', 'is', null)

    if (eduError) {
      throw new Error(`Failed to get education stats: ${eduError.message}`)
    }

    // Get candidates with CVs
    const { count: candidatesWithCVs, error: cvError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .not('cv_file_url', 'is', null)

    if (cvError) {
      throw new Error(`Failed to get CV stats: ${cvError.message}`)
    }

    // Get candidates with available documents
    const { count: availableDocuments, error: docError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .not('available_documents', 'is', null)

    if (docError) {
      throw new Error(`Failed to get document stats: ${docError.message}`)
    }

    // Get recent enhancement runs
    const { data: recentRuns, error: runsError } = await supabase
      .from('scrape_runs')
      .select('id, status, started_at, completed_at, total_found, total_processed, total_new, duration_seconds')
      .eq('source', 'loxo')
      .eq('run_type', 'enhancement')
      .order('started_at', { ascending: false })
      .limit(10)

    if (runsError) {
      log.warn({ error: runsError }, 'Failed to get recent enhancement runs')
    }

    // Calculate enhancement coverage percentages
    const bioDescriptionCoverage = totalLoxoCandidates > 0 
      ? Math.round((enhancedCandidates / totalLoxoCandidates) * 100) 
      : 0

    const jobHistoryCoverage = totalLoxoCandidates > 0 
      ? Math.round((detailedJobHistory / totalLoxoCandidates) * 100) 
      : 0

    const educationCoverage = totalLoxoCandidates > 0 
      ? Math.round((educationHistory / totalLoxoCandidates) * 100) 
      : 0

    const cvCoverage = totalLoxoCandidates > 0 
      ? Math.round((candidatesWithCVs / totalLoxoCandidates) * 100) 
      : 0

    const documentCoverage = totalLoxoCandidates > 0 
      ? Math.round((availableDocuments / totalLoxoCandidates) * 100) 
      : 0

    // Get candidates needing enhancement
    const { count: needingEnhancement, error: needingError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'loxo')
      .or('bio_description.is.null,detailed_job_history.is.null,education_history.is.null,available_documents.is.null')

    if (needingError) {
      log.warn({ error: needingError }, 'Failed to get candidates needing enhancement')
    }

    return {
      overview: {
        totalLoxoCandidates: totalLoxoCandidates || 0,
        enhancedCandidates: enhancedCandidates || 0,
        needingEnhancement: needingEnhancement || 0,
        enhancementProgress: totalLoxoCandidates > 0 
          ? Math.round(((totalLoxoCandidates - (needingEnhancement || 0)) / totalLoxoCandidates) * 100)
          : 0
      },
      coverage: {
        bioDescription: {
          count: enhancedCandidates || 0,
          percentage: bioDescriptionCoverage
        },
        detailedJobHistory: {
          count: detailedJobHistory || 0,
          percentage: jobHistoryCoverage
        },
        educationHistory: {
          count: educationHistory || 0,
          percentage: educationCoverage
        },
        cvFiles: {
          count: candidatesWithCVs || 0,
          percentage: cvCoverage
        },
        availableDocuments: {
          count: availableDocuments || 0,
          percentage: documentCoverage
        }
      },
      recentRuns: recentRuns || [],
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    log.error({ error }, 'Failed to calculate enhancement stats')
    throw error
  }
}

// POST /api/sync/loxo/enhance/status - Start enhancement for candidates needing it
export async function POST(request: NextRequest) {
  try {
    const { batchSize = 100, downloadCVs = true } = await request.json()  // OPTIMIZED: Default to 100

    // Trigger enhancement for candidates that need it
    const enhanceResponse = await fetch(`${request.nextUrl.origin}/api/sync/loxo/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchSize,
        onlyMissing: true,
        downloadCVs
      })
    })

    const enhanceResult = await enhanceResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        message: 'Enhancement started',
        ...enhanceResult.data
      }
    })

  } catch (error) {
    loxoLogger.error({ error }, 'Failed to start enhancement')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start enhancement',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
