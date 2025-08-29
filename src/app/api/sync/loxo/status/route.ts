import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loxoLogger } from '@/lib/logger'

// GET /api/sync/loxo/status - Get Loxo sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'runId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get sync run details
    const { data: syncRun, error: runError } = await supabase
      .from('scrape_runs')
      .select('*')
      .eq('id', runId)
      .eq('source', 'loxo')
      .single()

    if (runError) {
      loxoLogger.error({ error: runError, runId }, 'Sync run not found')
      return NextResponse.json(
        { success: false, error: 'Sync run not found' },
        { status: 404 }
      )
    }

    // Get processing details
    const { data: items, error: itemsError } = await supabase
      .from('scrape_run_items')
      .select('processing_status, processing_notes')
      .eq('run_id', runId)

    const itemStats = items?.reduce((acc, item) => {
      acc[item.processing_status] = (acc[item.processing_status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate progress percentage
    const totalItems = items?.length || 0
    const processedItems = (itemStats.processed || 0) + (itemStats.failed || 0) + (itemStats.skipped || 0)
    const progressPercentage = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0

    // Estimate completion time if still running
    let estimatedCompletion = null
    if (syncRun.status === 'running' && syncRun.started_at && processedItems > 0) {
      const startTime = new Date(syncRun.started_at).getTime()
      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime
      const averageTimePerItem = elapsedTime / processedItems
      const remainingItems = totalItems - processedItems
      const estimatedRemainingTime = remainingItems * averageTimePerItem
      estimatedCompletion = new Date(currentTime + estimatedRemainingTime).toISOString()
    }

    const response = {
      success: true,
      data: {
        ...syncRun,
        progress: {
          totalItems,
          processedItems,
          percentage: progressPercentage,
          pending: itemStats.pending || 0,
          processed: itemStats.processed || 0,
          failed: itemStats.failed || 0,
          skipped: itemStats.skipped || 0
        },
        estimatedCompletion,
        runtime: syncRun.started_at 
          ? Math.floor((Date.now() - new Date(syncRun.started_at).getTime()) / 1000)
          : 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    loxoLogger.error({ error }, 'Failed to get sync status')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/sync/loxo/status - Cancel running sync
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'runId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Update sync run status to cancelled
    const { data: syncRun, error } = await supabase
      .from('scrape_runs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', runId)
      .eq('source', 'loxo')
      .select()
      .single()

    if (error) {
      loxoLogger.error({ error, runId }, 'Failed to cancel sync run')
      return NextResponse.json(
        { success: false, error: 'Failed to cancel sync run' },
        { status: 404 }
      )
    }

    loxoLogger.info({ runId }, 'Sync run cancelled')

    return NextResponse.json({
      success: true,
      data: syncRun,
      message: 'Sync run cancelled successfully'
    })

  } catch (error) {
    loxoLogger.error({ error }, 'Failed to cancel sync')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}