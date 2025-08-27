import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { candidateService, embeddingJobService } from '@/lib/database/helpers'
import { deduplicationEngine } from '@/lib/database/deduplication'
import { cvLogger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import mammoth from 'mammoth'

// POST /api/upload/cv - Upload and process CV file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const candidateId = formData.get('candidateId') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF and Word documents are allowed.' },
        { status: 400 }
      )
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }
    
    cvLogger.info({ 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      candidateId 
    }, 'Processing CV upload')
    
    const supabase = await createClient()
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `cvs/${fileName}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-cv')
      .upload(filePath, file)
    
    if (uploadError) {
      cvLogger.error({ error: uploadError }, 'Failed to upload CV to storage')
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      )
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-cv')
      .getPublicUrl(filePath)
    
    // Extract text from the uploaded file
    let extractedText = ''
    let extractedData: any = null
    
    try {
      const fileBuffer = await file.arrayBuffer()
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(fileBuffer)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        extractedText = result.value
      } else if (file.type === 'application/msword') {
        // For older .doc files, we'll use a simple text extraction
        extractedText = new TextDecoder().decode(fileBuffer)
      }
      
      // Extract basic information from CV text
      extractedData = extractCVData(extractedText)
      
      cvLogger.info({ 
        fileName: file.name,
        extractedLength: extractedText.length,
        hasEmail: !!extractedData.email,
        hasPhone: !!extractedData.phone
      }, 'CV text extracted successfully')
      
    } catch (parseError) {
      cvLogger.warn({ error: parseError, fileName: file.name }, 'Failed to extract text from CV')
      // Continue without text extraction
    }
    
    // Create or update candidate with CV info
    let candidate
    if (candidateId) {
      // Update existing candidate
      candidate = await candidateService.updateCandidate(candidateId, {
        cv_file_url: publicUrl,
        cv_file_name: file.name,
        cv_uploaded_at: new Date().toISOString(),
        cv_parsed_text: extractedText,
        ...(extractedData.email && !candidate?.email && { email: extractedData.email }),
        ...(extractedData.phone && !candidate?.phone && { phone: extractedData.phone }),
        ...(extractedData.skills?.length && { skills: extractedData.skills }),
        embedding_status: 'pending' // Trigger re-embedding
      })
    } else {
      // Create new candidate from CV using deduplication engine
      const candidateData = {
        source: 'cv_upload' as const,
        cv_file_url: publicUrl,
        cv_file_name: file.name,
        cv_uploaded_at: new Date().toISOString(),
        cv_parsed_text: extractedText,
        status: 'active' as const,
        contact_status: 'new' as const,
        priority: 'medium' as const,
        tags: [],
        embedding_status: 'pending' as const,
        ...extractedData
      }
      
      const result = await deduplicationEngine.processCandidate(candidateData)
      candidate = result.candidate
      
      cvLogger.info({ 
        candidateId: candidate.id,
        action: result.action,
        matchedOn: result.matchedOn
      }, 'Candidate processed through deduplication engine')
    }
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Failed to create/update candidate' },
        { status: 500 }
      )
    }
    
    // Store document record
    const { error: docError } = await (supabase as any)
      .from('candidate_documents')
      .insert({
        candidate_id: candidate.id,
        document_type: 'cv',
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        upload_source: 'manual',
        processing_status: 'pending'
      })
    
    if (docError) {
      cvLogger.error({ error: docError }, 'Failed to store document record')
    }
    
    // Queue CV processing job
    await embeddingJobService.queueEmbeddingJob(candidate.id, 'cv_chunks', 100)
    
    cvLogger.info({ 
      candidateId: candidate.id, 
      fileName: file.name,
      fileUrl: publicUrl 
    }, 'CV upload completed successfully')
    
    return NextResponse.json({
      success: true,
      data: {
        candidate,
        file: {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        },
        message: 'CV uploaded successfully. Processing will begin shortly.'
      }
    })
  } catch (error) {
    cvLogger.error({ error }, 'CV upload failed')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload CV',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Note: This is a simplified implementation
    // In production, you might want to use a more robust PDF parser
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let text = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      text += pageText + '\n'
    }
    
    return text.trim()
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`)
  }
}

/**
 * Extract structured data from CV text
 */
function extractCVData(text: string): {
  email?: string
  phone?: string
  skills?: string[]
  name?: string
} {
  const result: any = {}
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    result.email = emailMatch[0]
  }
  
  // Extract phone number (basic patterns)
  const phoneMatch = text.match(/(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/)
  if (phoneMatch) {
    result.phone = phoneMatch[0]
  }
  
  // Extract skills (common tech skills)
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql',
    'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'vue', 'angular',
    'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest', 'api',
    'microservices', 'devops', 'ci/cd', 'terraform', 'jenkins'
  ]
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
  
  if (foundSkills.length > 0) {
    result.skills = foundSkills
  }
  
  // Extract name (look for "Name:" pattern or first line)
  const nameMatch = text.match(/(?:Name[:\s]+)([A-Z][a-z]+ [A-Z][a-z]+)/i)
  if (nameMatch) {
    result.name = nameMatch[1]
    const nameParts = result.name.split(' ')
    result.first_name = nameParts[0]
    result.last_name = nameParts.slice(1).join(' ')
  }
  
  return result
}