import { NextRequest, NextResponse } from 'next/server'
import { candidateService } from '@/lib/database/helpers'
import { logger } from '@/lib/logger'

// GET /api/candidates/[id] - Get candidate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidate = await candidateService.getCandidateById(id)
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: candidate
    })
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Error fetching candidate')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/candidates/[id] - Update candidate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    logger.info({ candidateId: id, updateData: Object.keys(data) }, 'Updating candidate')

    const candidate = await candidateService.updateCandidate(id, data)
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found or update failed' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: candidate
    })
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Error updating candidate')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/candidates/[id] - Delete candidate (soft delete by setting status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logger.info({ candidateId: id }, 'Deleting candidate')

    // Soft delete by updating status
    const candidate = await candidateService.updateCandidate(id, {
      status: 'inactive'
    })
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully'
    })
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Error deleting candidate')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}