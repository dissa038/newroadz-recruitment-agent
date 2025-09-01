import { createServiceClient } from '@/lib/supabase/server'
import { loxoLogger } from '@/lib/logger'

export interface CVDownloadResult {
  success: boolean
  fileUrl?: string
  fileName?: string
  parsedText?: string
  error?: string
}

/**
 * Download and process CV files from Loxo
 */
export class LoxoCVDownloader {
  private supabase: any
  private log: any

  constructor() {
    this.log = loxoLogger.child({ service: 'cv-downloader' })
  }

  async initialize() {
    this.supabase = createServiceClient()
  }

  /**
   * Download CV for a candidate from Loxo
   */
  async downloadCandidateCV(candidateId: string, loxoId: string, resumeId: string): Promise<CVDownloadResult> {
    try {
      if (!this.supabase) {
        await this.initialize()
      }

      this.log.info({ candidateId, loxoId, resumeId }, 'Starting CV download')

      // Get CV download URL from Loxo
      const downloadUrl = await this.getLoxoCVDownloadUrl(loxoId, resumeId)
      if (!downloadUrl) {
        return { success: false, error: 'Could not get download URL from Loxo' }
      }

      // Download the file
      const fileData = await this.downloadFile(downloadUrl)
      if (!fileData) {
        return { success: false, error: 'Failed to download CV file' }
      }

      // Generate filename
      const fileName = `cv_${candidateId}_${resumeId}.${this.getFileExtension(fileData.contentType)}`

      // Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(fileName, fileData.buffer, fileData.contentType)
      if (!uploadResult.success) {
        return { success: false, error: `Failed to upload CV: ${uploadResult.error}` }
      }

      // Parse text content if it's a supported format
      let parsedText = null
      if (this.isTextParseable(fileData.contentType)) {
        parsedText = await this.parseTextContent(fileData.buffer, fileData.contentType)
      }

      // Update candidate record
      await this.updateCandidateCV(candidateId, uploadResult.publicUrl!, fileName, parsedText)

      // Create document record
      await this.createDocumentRecord(candidateId, fileName, uploadResult.publicUrl!, fileData.size, fileData.contentType, parsedText)

      this.log.info({ candidateId, fileName, hasText: !!parsedText }, 'CV download completed successfully')

      return {
        success: true,
        fileUrl: uploadResult.publicUrl,
        fileName,
        parsedText
      }

    } catch (error) {
      this.log.error({ candidateId, loxoId, resumeId, error }, 'CV download failed')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get CV download URL from Loxo API - FIXED: Resumes data is already in person response!
   */
  private async getLoxoCVDownloadUrl(loxoId: string, resumeId: string): Promise<string | null> {
    try {
      // The resumes data is already available in the person response from enhancement
      // We don't need a separate API call - just construct the download URL directly
      const downloadUrl = `${process.env.LOXO_API_URL}/${process.env.LOXO_AGENCY_SLUG}/people/${loxoId}/resumes/${resumeId}/download`

      this.log.info({ loxoId, resumeId, downloadUrl }, 'Using direct CV download URL')

      return downloadUrl

    } catch (error) {
      this.log.error({ loxoId, resumeId, error }, 'Error constructing CV download URL')
      return null
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<{ buffer: Buffer, contentType: string, size: number } | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        this.log.error({ url, status: response.status }, 'Failed to download file')
        return null
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const size = buffer.length

      return { buffer, contentType, size }

    } catch (error) {
      this.log.error({ url, error }, 'Error downloading file')
      return null
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  private async uploadToStorage(fileName: string, buffer: Buffer, contentType: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'candidate-cv')
        .upload(`loxo-cvs/${fileName}`, buffer, {
          contentType,
          upsert: true
        })

      if (error) {
        this.log.error({ fileName, error }, 'Storage upload failed')
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'candidate-cv')
        .getPublicUrl(`loxo-cvs/${fileName}`)

      return { 
        success: true, 
        publicUrl: publicUrlData.publicUrl,
        path: data.path 
      }

    } catch (error) {
      this.log.error({ fileName, error }, 'Storage upload error')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Parse text content from file buffer
   */
  private async parseTextContent(buffer: Buffer, contentType: string): Promise<string | null> {
    try {
      // For now, only handle plain text files
      // In the future, we can add PDF parsing, Word doc parsing, etc.
      if (contentType.includes('text/plain')) {
        return buffer.toString('utf-8')
      }

      // TODO: Add PDF parsing with pdf-parse
      // TODO: Add Word document parsing with mammoth
      // TODO: Add other document format support

      return null

    } catch (error) {
      this.log.error({ contentType, error }, 'Text parsing failed')
      return null
    }
  }

  /**
   * Update candidate record with CV info
   */
  private async updateCandidateCV(candidateId: string, fileUrl: string, fileName: string, parsedText: string | null) {
    const updateData: any = {
      cv_file_url: fileUrl,
      cv_file_name: fileName,
      cv_uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (parsedText) {
      updateData.cv_parsed_text = parsedText
    }

    const { error } = await this.supabase
      .from('candidates')
      .update(updateData)
      .eq('id', candidateId)

    if (error) {
      this.log.error({ candidateId, error }, 'Failed to update candidate CV info')
      throw error
    }
  }

  /**
   * Create document record
   */
  private async createDocumentRecord(candidateId: string, fileName: string, fileUrl: string, fileSize: number, mimeType: string, parsedText: string | null) {
    const { error } = await this.supabase
      .from('candidate_documents')
      .insert({
        candidate_id: candidateId,
        document_type: 'cv',
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        parsing_status: parsedText ? 'completed' : 'pending',
        parsed_text: parsedText,
        upload_source: 'loxo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      this.log.error({ candidateId, fileName, error }, 'Failed to create document record')
      throw error
    }
  }

  /**
   * Get file extension from content type
   */
  private getFileExtension(contentType: string): string {
    const extensions: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'text/rtf': 'rtf',
      'application/rtf': 'rtf'
    }

    return extensions[contentType] || 'bin'
  }

  /**
   * Check if content type can be parsed for text
   */
  private isTextParseable(contentType: string): boolean {
    const parseableTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    return parseableTypes.some(type => contentType.includes(type))
  }
}

// Export singleton instance
export const cvDownloader = new LoxoCVDownloader()
