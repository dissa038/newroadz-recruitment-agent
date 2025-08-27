export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Core database types for Newroads Recruitment Agent
export interface Candidate {
  id: string
  external_id?: string
  source: 'apollo' | 'loxo' | 'cv_upload' | 'manual'
  
  // Core Personal Info
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  phone?: string
  linkedin_url?: string
  
  // Professional Info
  current_title?: string
  current_company?: string
  headline?: string
  seniority_level?: string
  years_experience?: number
  industry?: string
  
  // Location
  city?: string
  state?: string
  country?: string
  
  // Apollo/Loxo specific
  apollo_id?: string
  loxo_id?: string
  departments?: string[]
  functions?: string[]
  apollo_seniority?: string
  photo_url?: string
  is_likely_to_engage?: boolean
  
  // Contact & Outreach
  contact_status: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'hired'
  
  // CV & Documents
  cv_file_url?: string
  cv_file_name?: string
  cv_parsed_text?: string
  
  // Skills & Meta
  skills?: string[]
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'inactive' | 'hired' | 'blacklisted'
  
  // Embeddings & Search
  embedding_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  search_vector?: unknown
  
  // Raw data
  apollo_raw_data?: Json
  loxo_raw_data?: Json
  employment_history?: Json
  custom_fields?: Json
  
  // Timestamps
  created_at: string
  updated_at: string
  last_synced_at?: string
}

export interface CandidateInsert extends Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'full_name'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface CandidateUpdate extends Partial<Omit<Candidate, 'id' | 'created_at' | 'full_name'>> {}

export interface CandidateEmbedding {
  id: string
  candidate_id: string
  embedding_type: 'profile' | 'cv_chunk' | 'skills' | 'experience'
  content_hash: string
  source_text: string
  embedding: number[] // Vector type
  chunk_index?: number
  metadata?: Json
  created_at: string
}

export interface ChatConversation {
  id: string
  user_id: string
  title?: string
  auto_title_generated: boolean
  status: 'active' | 'archived' | 'deleted'
  message_count: number
  last_message_at?: string
  context_summary?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning_model?: string
  token_count?: number
  processing_time_ms?: number
  search_results?: Json
  actions_taken?: Json
  status: 'pending' | 'sent' | 'failed' | 'edited'
  error_message?: string
  reply_to_id?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  website_url?: string
  linkedin_url?: string
  apollo_id?: string
  loxo_id?: string
  industry?: string
  size_range?: string
  location?: string
  description?: string
  apollo_raw_data?: Json
  loxo_raw_data?: Json
  created_at: string
  updated_at: string
}

export interface ScrapeRun {
  id: string
  source: 'apollo' | 'loxo'
  run_type: 'manual' | 'scheduled' | 'webhook' | 'full_sync' | 'incremental_sync'
  search_query?: string
  filters?: Json
  max_results?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_found: number
  total_processed: number
  total_new: number
  total_updated: number
  total_duplicates: number
  started_at: string
  completed_at?: string
  error_message?: string
  created_at: string
}

export interface EmbeddingJob {
  id: string
  candidate_id: string
  job_type: 'profile' | 'cv_chunks' | 'full_reindex'
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  attempts: number
  max_attempts: number
  started_at?: string
  completed_at?: string
  processing_time_ms?: number
  last_error?: string
  job_data?: Json
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  full_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  company?: string
  job_title?: string
  location?: string
  website?: string
  linkedin_url?: string
  twitter_url?: string
  github_url?: string
  preferences?: Json
  created_at: string
  updated_at: string
}

export interface UserProfileInsert extends Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'full_name'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface UserProfileUpdate extends Partial<Omit<UserProfile, 'id' | 'created_at' | 'full_name'>> {}

// Search and filtering types
export interface CandidateSearchParams {
  query?: string
  skills?: string[]
  location?: string
  seniority_level?: string
  company?: string
  source?: Candidate['source']
  status?: Candidate['status']
  contact_status?: Candidate['contact_status']
  tags?: string[]
  limit?: number
  offset?: number
}

export interface CandidateSearchResult {
  candidates: Candidate[]
  total: number
  facets?: {
    skills: Array<{ skill: string; count: number }>
    companies: Array<{ company: string; count: number }>
    locations: Array<{ location: string; count: number }>
  }
}

// AI Agent types
export interface AISearchQuery {
  query: string
  filters?: CandidateSearchParams
  includeActions?: boolean
  context?: Json
}

export interface AISearchResponse {
  candidates: Candidate[]
  reasoning: string
  suggestedActions?: string[]
  followUpQuestions?: string[]
  searchMetadata: {
    totalFound: number
    searchTime: number
    model: string
  }
}