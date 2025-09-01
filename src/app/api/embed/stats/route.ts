import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get candidate embedding stats for ALL sources
    const { data: candidateStats, error: candidateError } = await supabase
      .from('candidates')
      .select('embedding_status, source')

    if (candidateError) {
      throw candidateError
    }

    // Get job queue stats
    const { data: jobStats, error: jobError } = await supabase
      .from('embedding_jobs')
      .select('status')

    if (jobError) {
      throw jobError
    }

    // Calculate overall stats
    const total_candidates = candidateStats.length
    const pending_embeddings = candidateStats.filter(c => c.embedding_status === 'pending').length
    const completed_embeddings = candidateStats.filter(c => c.embedding_status === 'completed').length
    const failed_embeddings = candidateStats.filter(c => c.embedding_status === 'failed').length
    const in_progress_embeddings = candidateStats.filter(c => c.embedding_status === 'in_progress').length

    const pending_jobs = jobStats.filter(j => j.status === 'pending').length
    const processing_jobs = jobStats.filter(j => j.status === 'in_progress').length

    // Calculate source breakdown
    const source_breakdown = candidateStats.reduce((acc, candidate) => {
      const source = candidate.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Ensure all expected sources are present
    const standardizedBreakdown = {
      loxo: source_breakdown.loxo || 0,
      apollo: source_breakdown.apollo || 0,
      cv_upload: source_breakdown.cv_upload || 0,
      manual: source_breakdown.manual || 0
    }

    return Response.json({
      total_candidates,
      pending_embeddings,
      completed_embeddings,
      failed_embeddings,
      in_progress_embeddings,
      pending_jobs,
      processing_jobs,
      source_breakdown: standardizedBreakdown
    })

  } catch (error) {
    console.error('Error fetching embedding stats:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
