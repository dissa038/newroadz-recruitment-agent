import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apolloLogger } from '@/lib/logger'

// POST /api/scrape/apollo/start - Start Apollo scraping via Apify
export async function POST(request: NextRequest) {
  try {
    const { searchUrl, maxResults = 1000, filters = {} } = await request.json()
    
    if (!searchUrl) {
      return NextResponse.json(
        { success: false, error: 'searchUrl is required' },
        { status: 400 }
      )
    }

    if (!process.env.APIFY_API_TOKEN || !process.env.APOLLO_ACTOR_ID) {
      apolloLogger.error('Missing Apify configuration')
      return NextResponse.json(
        { success: false, error: 'Apify configuration missing' },
        { status: 500 }
      )
    }

    apolloLogger.info({ searchUrl, maxResults, filters }, 'Starting Apollo scrape')

    const supabase = await createClient()

    // Create scrape run record
    const { data: scrapeRun, error: runError } = await supabase
      .from('scrape_runs')
      .insert({
        source: 'apollo',
        run_type: 'manual',
        search_query: searchUrl,
        filters: filters,
        max_results: maxResults,
        status: 'pending'
      })
      .select()
      .single()

    if (runError) {
      apolloLogger.error({ error: runError }, 'Failed to create scrape run')
      return NextResponse.json(
        { success: false, error: 'Failed to create scrape run' },
        { status: 500 }
      )
    }

    // Prepare Apify actor input
    const actorInput = {
      searchUrl: searchUrl,
      maxResults: maxResults,
      includeEmails: true,
      includePhoneNumbers: true,
      includePersonalEmails: true,
      includeContactInfo: true,
      webhook: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scrape/apollo/webhook`,
      webhookPayload: {
        scrapeRunId: scrapeRun.id,
        source: 'apollo'
      }
    }

    // Start Apify actor
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/${process.env.APOLLO_ACTOR_ID}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
      },
      body: JSON.stringify(actorInput)
    })

    if (!apifyResponse.ok) {
      const errorData = await apifyResponse.text()
      apolloLogger.error({ 
        status: apifyResponse.status, 
        error: errorData 
      }, 'Failed to start Apify actor')
      
      // Update scrape run status
      await supabase
        .from('scrape_runs')
        .update({ 
          status: 'failed', 
          error_message: `Apify actor failed to start: ${errorData}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', scrapeRun.id)

      return NextResponse.json(
        { success: false, error: 'Failed to start scraping' },
        { status: 500 }
      )
    }

    const actorRun = await apifyResponse.json()

    // Update scrape run with actor details
    await supabase
      .from('scrape_runs')
      .update({
        actor_id: process.env.APOLLO_ACTOR_ID,
        actor_run_id: actorRun.data.id,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', scrapeRun.id)

    apolloLogger.info({ 
      scrapeRunId: scrapeRun.id,
      actorRunId: actorRun.data.id 
    }, 'Apollo scrape started successfully')

    return NextResponse.json({
      success: true,
      data: {
        scrapeRunId: scrapeRun.id,
        actorRunId: actorRun.data.id,
        status: 'running',
        message: 'Scraping started successfully. You will receive results via webhook.'
      }
    })

  } catch (error) {
    apolloLogger.error({ error }, 'Failed to start Apollo scrape')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start scraping',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/scrape/apollo/start - Get scraping status
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
    
    const { data: scrapeRun, error } = await supabase
      .from('scrape_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Scrape run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: scrapeRun
    })

  } catch (error) {
    apolloLogger.error({ error }, 'Failed to get scrape status')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scrape status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}