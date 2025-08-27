import { NextRequest, NextResponse } from 'next/server'
import { candidateService } from '@/lib/database/helpers'
import { embeddingJobService } from '@/lib/database/helpers'
import { logger } from '@/lib/logger'
import { CandidateSearchParams } from '@/types/database'

// GET /api/candidates - Search candidates with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params: CandidateSearchParams = {
      query: searchParams.get('query') || undefined,
      skills: searchParams.get('skills')?.split(',') || undefined,
      location: searchParams.get('location') || undefined,
      seniority_level: searchParams.get('seniority_level') || undefined,
      company: searchParams.get('company') || undefined,
      source: searchParams.get('source') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      contact_status: searchParams.get('contact_status') as any || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    logger.info({ params }, 'Searching candidates')
    
    const results = await candidateService.searchCandidates(params)
    
    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        total: results.total,
        limit: params.limit,
        offset: params.offset,
        hasMore: results.total > (params.offset || 0) + (params.limit || 50)
      }
    })
  } catch (error) {
    logger.error({ error }, 'Error searching candidates')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search candidates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/candidates - Create new candidate
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    logger.info({ candidateData: { email: data.email, source: data.source } }, 'Creating new candidate')
    
    // Create candidate
    const candidate = await candidateService.createCandidate(data)
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Failed to create candidate' },
        { status: 400 }
      )
    }
    
    // Queue embedding job for new candidate
    await embeddingJobService.queueEmbeddingJob(candidate.id, 'profile', 200)
    
    logger.info({ candidateId: candidate.id }, 'Candidate created successfully')
    
    return NextResponse.json({
      success: true,
      data: candidate
    }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error creating candidate')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}