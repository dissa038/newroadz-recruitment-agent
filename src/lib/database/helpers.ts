import { createServiceClient } from '@/lib/supabase/server'
import { 
  Candidate, 
  CandidateInsert, 
  CandidateUpdate, 
  CandidateSearchParams, 
  CandidateSearchResult 
} from '@/types/database'

// Database helper functions for candidates
export class CandidateService {
  private getSupabase() {
    return createServiceClient()
  }

  // Create a new candidate
  async createCandidate(data: CandidateInsert): Promise<Candidate | null> {
    const supabase = this.getSupabase()
    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating candidate:', error)
      return null
    }

    return candidate
  }

  // Get candidate by ID
  async getCandidateById(id: string): Promise<Candidate | null> {
    const supabase = this.getSupabase()
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching candidate:', error)
      return null
    }

    return candidate
  }

  // Update candidate
  async updateCandidate(id: string, data: CandidateUpdate): Promise<Candidate | null> {
    const supabase = this.getSupabase()
    const { data: candidate, error } = await supabase
      .from('candidates')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating candidate:', error)
      return null
    }

    return candidate
  }

  // Search candidates with filters
  async searchCandidates(params: CandidateSearchParams): Promise<CandidateSearchResult> {
    const supabase = this.getSupabase()
    let query = supabase
      .from('candidates')
      .select('*', { count: 'exact' })

    // Apply filters
    if (params.query) {
      query = query.textSearch('search_vector', params.query)
    }

    if (params.skills?.length) {
      query = query.overlaps('skills', params.skills)
    }

    if (params.location) {
      query = query.or(`city.ilike.%${params.location}%,state.ilike.%${params.location}%,country.ilike.%${params.location}%`)
    }

    if (params.seniority_level) {
      query = query.eq('seniority_level', params.seniority_level)
    }

    if (params.company) {
      query = query.ilike('current_company', `%${params.company}%`)
    }

    if (params.source) {
      query = query.eq('source', params.source)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.contact_status) {
      query = query.eq('contact_status', params.contact_status)
    }

    if (params.tags?.length) {
      query = query.overlaps('tags', params.tags)
    }

    // Pagination
    const limit = params.limit || 50
    const offset = params.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Order by relevance/updated date
    query = query.order('updated_at', { ascending: false })

    const { data: candidates, error, count } = await query

    if (error) {
      console.error('Error searching candidates:', error)
      return { candidates: [], total: 0 }
    }

    return {
      candidates: candidates || [],
      total: count || 0
    }
  }

  // Find potential duplicates
  async findPotentialDuplicates(candidate: Partial<Candidate>): Promise<Candidate[]> {
    const queries = []

    const supabase = this.getSupabase()
    
    // Level 1: Exact LinkedIn match
    if (candidate.linkedin_url) {
      queries.push(
        supabase
          .from('candidates')
          .select('*')
          .eq('linkedin_url', candidate.linkedin_url)
      )
    }

    // Level 2: Exact email match
    if (candidate.email) {
      queries.push(
        supabase
          .from('candidates')
          .select('*')
          .eq('email', candidate.email)
      )
    }

    // Level 3: Name + company match
    if (candidate.full_name && candidate.current_company) {
      queries.push(
        supabase
          .from('candidates')
          .select('*')
          .eq('full_name', candidate.full_name)
          .eq('current_company', candidate.current_company)
      )
    }

    const results = await Promise.allSettled(queries)
    const duplicates: Candidate[] = []

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        duplicates.push(...result.value.data)
      }
    }

    // Remove duplicates and return unique candidates
    const uniqueDuplicates = duplicates.filter((candidate, index, array) => 
      array.findIndex(c => c.id === candidate.id) === index
    )

    return uniqueDuplicates
  }

  // Smart merge function for updating existing candidates
  async smartMerge(existingId: string, newData: Partial<Candidate>): Promise<Candidate | null> {
    const existing = await this.getCandidateById(existingId)
    if (!existing) return null

    const merged: CandidateUpdate = { ...existing }

    // Merge strategy: most recent, non-null data wins
    Object.keys(newData).forEach(key => {
      const newValue = newData[key as keyof Candidate]
      const existingValue = existing[key as keyof Candidate]

      if (newValue !== null && newValue !== undefined) {
        if (Array.isArray(newValue) && Array.isArray(existingValue)) {
          // Merge arrays and remove duplicates
          merged[key as keyof CandidateUpdate] = [...new Set([...existingValue, ...newValue])] as any
        } else if (existingValue === null || existingValue === undefined || newValue !== existingValue) {
          // Use new value if existing is null/undefined or different
          merged[key as keyof CandidateUpdate] = newValue as any
        }
      }
    })

    // Update the raw data fields appropriately
    if (newData.apollo_raw_data) {
      merged.apollo_raw_data = newData.apollo_raw_data
    }
    if (newData.loxo_raw_data) {
      merged.loxo_raw_data = newData.loxo_raw_data
    }

    merged.last_synced_at = new Date().toISOString()

    return this.updateCandidate(existingId, merged)
  }

  // Get candidates needing embedding
  async getCandidatesNeedingEmbedding(limit = 100): Promise<Candidate[]> {
    const supabase = this.getSupabase()
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('embedding_status', 'pending')
      .limit(limit)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching candidates needing embedding:', error)
      return []
    }

    return candidates || []
  }

  // Mark candidate as embedded
  async markCandidateEmbedded(id: string): Promise<void> {
    const supabase = this.getSupabase()
    await supabase
      .from('candidates')
      .update({
        embedding_status: 'completed',
        last_embedded_at: new Date().toISOString()
      })
      .eq('id', id)
  }
}

// Database helper for embedding jobs
export class EmbeddingJobService {
  private getSupabase() {
    return createServiceClient()
  }

  // Add embedding job to queue
  async queueEmbeddingJob(candidateId: string, jobType: 'profile' | 'cv_chunks' | 'full_reindex', priority = 100) {
    const supabase = this.getSupabase()
    const { error } = await (supabase as any)
      .from('embedding_jobs')
      .insert({
        candidate_id: candidateId,
        job_type: jobType,
        priority,
        status: 'pending'
      })

    if (error) {
      console.error('Error queueing embedding job:', error)
    }
  }

  // Get next pending job
  async getNextPendingJob() {
    const supabase = this.getSupabase()
    const { data: job, error } = await (supabase as any)
      .from('embedding_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Error fetching next embedding job:', error)
      return null
    }

    return job
  }

  // Update job status
  async updateJobStatus(jobId: string, status: 'in_progress' | 'completed' | 'failed', error?: string) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
      if (error) {
        updates.last_error = error
      }
    }

    const supabase = this.getSupabase()
    await (supabase as any)
      .from('embedding_jobs')
      .update(updates)
      .eq('id', jobId)
  }
}

// Export singleton instances
export const candidateService = new CandidateService()
export const embeddingJobService = new EmbeddingJobService()