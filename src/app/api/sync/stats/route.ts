import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apolloLogger } from '@/lib/logger'

// GET /api/sync/stats - Get sync statistics and overview
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get total candidates from Loxo
    const { count: totalLoxoCandidates } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .not('loxo_id', 'is', null)

    // Get total companies from Loxo
    const { count: totalLoxoCompanies } = await supabase
      .from('candidates')
      .select('company', { count: 'exact', head: true })
      .not('loxo_id', 'is', null)
      .not('company', 'is', null)

    // Get recent sync runs (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentSyncs, count: recentSyncCount } = await supabase
      .from('scrape_runs')
      .select('*', { count: 'exact' })
      .eq('source', 'loxo')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Get last successful sync
    const { data: lastSync } = await supabase
      .from('scrape_runs')
      .select('*')
      .eq('source', 'loxo')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)

    // Get currently running syncs
    const { data: runningSyncs, count: runningSyncCount } = await supabase
      .from('scrape_runs')
      .select('*', { count: 'exact' })
      .eq('source', 'loxo')
      .in('status', ['pending', 'running'])

    // Calculate recent activity stats
    const recentNewCandidates = recentSyncs?.reduce((sum, sync) => sum + (sync.total_new || 0), 0) || 0
    const recentUpdatedCandidates = recentSyncs?.reduce((sum, sync) => sum + (sync.total_updated || 0), 0) || 0
    const recentProcessedTotal = recentSyncs?.reduce((sum, sync) => sum + (sync.total_processed || 0), 0) || 0

    // Get sync success rate (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: monthlyStats } = await supabase
      .from('scrape_runs')
      .select('status')
      .eq('source', 'loxo')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const totalMonthlyRuns = monthlyStats?.length || 0
    const successfulRuns = monthlyStats?.filter(run => run.status === 'completed').length || 0
    const successRate = totalMonthlyRuns > 0 ? Math.round((successfulRuns / totalMonthlyRuns) * 100) : 0

    const stats = {
      overview: {
        totalLoxoCandidates: totalLoxoCandidates || 0,
        totalLoxoCompanies: totalLoxoCompanies || 0,
        runningSyncs: runningSyncCount || 0,
        successRate
      },
      lastSync: lastSync?.[0] ? {
        id: lastSync[0].id,
        completedAt: lastSync[0].completed_at,
        duration: lastSync[0].duration_seconds,
        totalProcessed: lastSync[0].total_processed,
        totalNew: lastSync[0].total_new,
        totalUpdated: lastSync[0].total_updated,
        syncType: lastSync[0].run_type
      } : null,
      recentActivity: {
        period: '7 days',
        totalSyncs: recentSyncCount || 0,
        newCandidates: recentNewCandidates,
        updatedCandidates: recentUpdatedCandidates,
        totalProcessed: recentProcessedTotal
      },
      runningSyncs: runningSyncs?.map(sync => ({
        id: sync.id,
        status: sync.status,
        startedAt: sync.started_at,
        syncType: sync.run_type,
        progress: sync.total_found ? Math.round((sync.total_processed / sync.total_found) * 100) : 0
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    apolloLogger.error({ error }, 'Error fetching sync stats')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync statistics' },
      { status: 500 }
    )
  }
}
