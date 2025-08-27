import { candidateService } from './helpers'
import { Candidate, CandidateInsert } from '@/types/database'
import crypto from 'crypto'

/**
 * Smart Deduplication & Update Engine
 * 
 * This is the core logic for maintaining a clean database and is applied to 
 * EVERY candidate import: Apollo Scrapes, Loxo Syncs, CV Uploads, and Manual Additions.
 */
export class DeduplicationEngine {
  
  /**
   * Process new candidate data through the unified deduplication flow
   */
  async processCandidate(newData: CandidateInsert): Promise<{
    candidate: Candidate
    action: 'created' | 'updated'
    matchedOn?: string
  }> {
    // Step 1: Find potential duplicates
    const duplicates = await this.findPotentialDuplicates(newData)
    
    if (duplicates.length === 0) {
      // No match found - create new candidate
      const candidate = await candidateService.createCandidate(newData)
      if (!candidate) {
        throw new Error('Failed to create new candidate')
      }
      
      return {
        candidate,
        action: 'created'
      }
    }
    
    // Step 2: Find the best match
    const bestMatch = this.findBestMatch(newData, duplicates)
    
    // Step 3: Smart merge with existing record
    const updatedCandidate = await candidateService.smartMerge(bestMatch.match.id, newData)
    if (!updatedCandidate) {
      throw new Error('Failed to update existing candidate')
    }
    
    return {
      candidate: updatedCandidate,
      action: 'updated',
      matchedOn: bestMatch.reason
    }
  }
  
  /**
   * Find potential duplicates with confidence scoring
   */
  private async findPotentialDuplicates(candidate: Partial<Candidate>): Promise<Candidate[]> {
    return candidateService.findPotentialDuplicates(candidate)
  }
  
  /**
   * Find the best match from potential duplicates with confidence scoring
   */
  private findBestMatch(newData: Partial<Candidate>, candidates: Candidate[]): {
    match: Candidate
    confidence: number
    reason: string
  } {
    let bestMatch = candidates[0]
    let bestConfidence = 0
    let bestReason = 'unknown'
    
    for (const candidate of candidates) {
      const result = this.calculateMatchConfidence(newData, candidate)
      
      if (result.confidence > bestConfidence) {
        bestMatch = candidate
        bestConfidence = result.confidence
        bestReason = result.reason
      }
    }
    
    return {
      match: bestMatch,
      confidence: bestConfidence,
      reason: bestReason
    }
  }
  
  /**
   * Calculate match confidence between new data and existing candidate
   */
  private calculateMatchConfidence(newData: Partial<Candidate>, existing: Candidate): {
    confidence: number
    reason: string
  } {
    // Level 1 (High Confidence): Exact match on linkedin_url
    if (newData.linkedin_url && existing.linkedin_url === newData.linkedin_url) {
      return { confidence: 0.95, reason: 'linkedin_url_exact_match' }
    }
    
    // Level 2 (High Confidence): Exact match on email
    if (newData.email && existing.email === newData.email) {
      return { confidence: 0.90, reason: 'email_exact_match' }
    }
    
    // Level 3 (Medium Confidence): Fuzzy match on full_name AND exact match on current_company
    if (newData.full_name && newData.current_company && 
        existing.current_company === newData.current_company) {
      const nameSimilarity = this.calculateNameSimilarity(newData.full_name, existing.full_name || '')
      if (nameSimilarity > 0.8) {
        return { confidence: 0.75, reason: 'name_company_match' }
      }
    }
    
    // Level 4 (Medium Confidence): External ID matches
    if (newData.apollo_id && existing.apollo_id === newData.apollo_id) {
      return { confidence: 0.85, reason: 'apollo_id_match' }
    }
    
    if (newData.loxo_id && existing.loxo_id === newData.loxo_id) {
      return { confidence: 0.85, reason: 'loxo_id_match' }
    }
    
    // Level 5 (Lower Confidence): Phone number match
    if (newData.phone && existing.phone === newData.phone) {
      return { confidence: 0.70, reason: 'phone_match' }
    }
    
    return { confidence: 0, reason: 'no_match' }
  }
  
  /**
   * Calculate name similarity using Levenshtein distance
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
    const n1 = normalize(name1)
    const n2 = normalize(name2)
    
    if (n1 === n2) return 1.0
    
    const distance = this.levenshteinDistance(n1, n2)
    const maxLength = Math.max(n1.length, n2.length)
    
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  /**
   * Generate content hash for deduplication
   */
  generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }
  
  /**
   * Check if candidate data has significant changes to trigger re-embedding
   */
  hasSignificantChanges(existing: Candidate, newData: Partial<Candidate>): boolean {
    const significantFields = [
      'headline',
      'skills',
      'employment_history',
      'current_title',
      'current_company',
      'cv_parsed_text'
    ]
    
    return significantFields.some(field => {
      const existingValue = existing[field as keyof Candidate]
      const newValue = newData[field as keyof Candidate]
      
      if (Array.isArray(existingValue) && Array.isArray(newValue)) {
        return JSON.stringify(existingValue.sort()) !== JSON.stringify(newValue.sort())
      }
      
      if (typeof existingValue === 'object' && typeof newValue === 'object') {
        return JSON.stringify(existingValue) !== JSON.stringify(newValue)
      }
      
      return existingValue !== newValue
    })
  }
}

// Export singleton instance
export const deduplicationEngine = new DeduplicationEngine()