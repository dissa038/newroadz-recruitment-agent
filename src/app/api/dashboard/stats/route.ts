import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    logger.info('Fetching dashboard statistics')

    // Get total candidates count
    const { count: totalCandidates, error: totalError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (totalError) {
      logger.error({ error: totalError }, 'Failed to fetch total candidates count')
    }

    // Get candidates added this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: newThisWeek, error: weekError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', weekAgo.toISOString())

    if (weekError) {
      logger.error({ error: weekError }, 'Failed to fetch new candidates count')
    }

    // Get candidates added last week for comparison
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const { count: newLastWeek, error: lastWeekError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString())

    // Get active scrape runs
    const { count: activeScrapes, error: scrapeError } = await supabase
      .from('scrape_runs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'running'])

    if (scrapeError) {
      logger.error({ error: scrapeError }, 'Failed to fetch active scrapes count')
    }

    // Get completed scrapes this week
    const { count: completedThisWeek, error: completedError } = await supabase
      .from('scrape_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString())

    // Get candidates by source distribution
    const { data: sourceDistribution, error: sourceError } = await supabase
      .from('candidates')
      .select('source')
      .eq('status', 'active')

    let sourceStats = { apollo: 0, loxo: 0, cv_upload: 0, manual: 0 }
    if (sourceDistribution && !sourceError) {
      sourceStats = sourceDistribution.reduce((acc, candidate) => {
        acc[candidate.source as keyof typeof acc] = (acc[candidate.source as keyof typeof acc] || 0) + 1
        return acc
      }, sourceStats)
    }

    // Get candidates with embeddings (completion rate)
    const { count: embeddedCandidates, error: embeddedError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('embedding_status', 'completed')

    // Get pending embedding jobs
    const { count: pendingEmbeddings, error: pendingError } = await supabase
      .from('embedding_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get recent conversations
    const { count: activeConversations, error: convError } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('last_message_at', weekAgo.toISOString())

    // Calculate trends
    const weeklyGrowth = newLastWeek && newLastWeek > 0 
      ? Math.round(((newThisWeek || 0) - newLastWeek) / newLastWeek * 100)
      : 0

    const embeddingCompletionRate = totalCandidates && totalCandidates > 0
      ? Math.round((embeddedCandidates || 0) / totalCandidates * 100)
      : 0

    const stats = {
      totalCandidates: totalCandidates || 0,
      newThisWeek: newThisWeek || 0,
      activeScrapes: activeScrapes || 0,
      embeddingCompletionRate,
      trends: {
        weeklyGrowth,
        completedScrapesThisWeek: completedThisWeek || 0,
        pendingEmbeddings: pendingEmbeddings || 0,
        activeConversations: activeConversations || 0
      },
      sourceDistribution: sourceStats,
      lastUpdated: new Date().toISOString()
    }

    logger.info({ stats }, 'Dashboard statistics fetched successfully')

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error({ error }, 'Failed to fetch dashboard statistics')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}