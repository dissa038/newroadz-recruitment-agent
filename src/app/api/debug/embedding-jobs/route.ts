import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Debugging embedding jobs...')

    // Test 1: Count all jobs
    const { data: allJobs, error: allError } = await supabase
      .from('embedding_jobs')
      .select('status, job_type', { count: 'exact' })

    if (allError) {
      console.error('Error fetching all jobs:', allError)
      return Response.json({ error: 'Failed to fetch all jobs', details: allError })
    }

    console.log(`📊 Total jobs in database: ${allJobs?.length || 0}`)

    // Test 2: Get pending jobs (same query as processor)
    const { data: pendingJobs, error: pendingError } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10)

    if (pendingError) {
      console.error('Error fetching pending jobs:', pendingError)
      return Response.json({ error: 'Failed to fetch pending jobs', details: pendingError })
    }

    console.log(`⏳ Pending jobs found: ${pendingJobs?.length || 0}`)

    // Test 3: Get job stats
    const { data: stats, error: statsError } = await supabase
      .from('embedding_jobs')
      .select('status, job_type')

    if (statsError) {
      console.error('Error fetching job stats:', statsError)
      return Response.json({ error: 'Failed to fetch job stats', details: statsError })
    }

    const statusBreakdown = stats?.reduce((acc, job) => {
      const key = `${job.status}_${job.job_type}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    console.log('📈 Status breakdown:', statusBreakdown)

    // Test 4: Check recent jobs
    const { data: recentJobs, error: recentError } = await supabase
      .from('embedding_jobs')
      .select('id, candidate_id, job_type, status, priority, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error fetching recent jobs:', recentError)
    }

    console.log('🕒 Recent jobs:', recentJobs)

    return Response.json({
      success: true,
      totalJobs: allJobs?.length || 0,
      pendingJobs: pendingJobs?.length || 0,
      statusBreakdown,
      recentJobs: recentJobs || [],
      samplePendingJobs: pendingJobs?.slice(0, 3) || []
    })

  } catch (error) {
    console.error('Debug error:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
