import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { apolloLogger } from '@/lib/logger'

// GET /api/scrape/runs - List all scrape runs with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const source = searchParams.get('source') // 'apollo' or 'loxo'
    const status = searchParams.get('status') // 'pending', 'running', 'completed', 'failed'
    
    const offset = (page - 1) * limit

    // Use service client (server-side) for read-only admin visibility
    const supabase = createServiceClient()
    
    // Build query
    let query = supabase
      .from('scrape_runs')
      .select(`
        *,
        scrape_run_items(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (source) {
      query = query.eq('source', source)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: runs, error, count } = await query

    if (error) {
      apolloLogger.error({ error }, 'Failed to fetch scrape runs')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scrape runs' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('scrape_runs')
      .select('*', { count: 'exact', head: true })

    if (source) {
      countQuery = countQuery.eq('source', source)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      success: true,
      data: {
        runs: runs || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      }
    })

  } catch (error) {
    apolloLogger.error({ error }, 'Error in scrape runs API')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
