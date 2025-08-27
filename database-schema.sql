-- Newroads Recruitment Agent Database Schema
-- Complete schema implementation for Supabase with pgvector support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS candidate_documents CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS candidate_embeddings CASCADE;
DROP TABLE IF EXISTS embedding_jobs CASCADE;
DROP TABLE IF EXISTS scrape_run_items CASCADE;
DROP TABLE IF EXISTS scrape_runs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;

-- Create candidates table (main table - unified schema)
CREATE TABLE candidates (
  -- Primary Keys & Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('apollo', 'loxo', 'cv_upload', 'manual')),

  -- Core Personal Info
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name || ' ' || last_name, first_name, last_name)) STORED,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  facebook_url TEXT,
  personal_website TEXT,

  -- Professional Info
  current_title TEXT,
  current_company TEXT,
  current_company_id TEXT,
  headline TEXT,
  seniority_level TEXT,
  years_experience INTEGER,
  industry TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT,

  -- Apollo-specific fields
  apollo_id TEXT,
  apollo_organization_id TEXT,
  apollo_account_id TEXT,
  email_status TEXT,
  apollo_confidence_score FLOAT,
  is_likely_to_engage BOOLEAN DEFAULT false,
  extrapolated_email_confidence FLOAT,
  departments TEXT[],
  subdepartments TEXT[],
  functions TEXT[],
  apollo_seniority TEXT,
  photo_url TEXT,
  intent_strength FLOAT,
  show_intent BOOLEAN DEFAULT false,
  revealed_for_current_team BOOLEAN DEFAULT false,

  -- Loxo-specific fields
  loxo_id TEXT,
  loxo_contact_id TEXT,
  loxo_profile_score FLOAT,
  loxo_tags TEXT[],

  -- Contact & Outreach
  email_deliverable BOOLEAN,
  phone_verified BOOLEAN,
  contact_quality_score FLOAT,
  last_contact_date TIMESTAMPTZ,
  contact_status TEXT DEFAULT 'new' CHECK (contact_status IN ('new', 'contacted', 'responded', 'interested', 'not_interested', 'hired')),

  -- CV & Documents
  cv_file_url TEXT,
  cv_file_name TEXT,
  cv_uploaded_at TIMESTAMPTZ,
  cv_parsed_text TEXT,

  -- Skills & Qualifications
  skills TEXT[],
  certifications TEXT[],
  education JSONB,
  languages TEXT[],

  -- Recruitment Meta
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hired', 'blacklisted')),
  salary_expectation TEXT,
  availability TEXT,
  remote_preference TEXT,

  -- Engagement Tracking
  profile_views INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  engagement_score FLOAT DEFAULT 0,

  -- Deduplication
  deduplicated BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES candidates(id),
  duplicate_confidence FLOAT,

  -- Embedding & Search
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'in_progress', 'completed', 'failed')),
  last_embedded_at TIMESTAMPTZ,
  search_vector tsvector,

  -- Rich Data (JSONB for flexibility)
  employment_history JSONB,
  apollo_raw_data JSONB,
  loxo_raw_data JSONB,
  custom_fields JSONB,
  social_profiles JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(email, source),
  UNIQUE(apollo_id) WHERE apollo_id IS NOT NULL,
  UNIQUE(loxo_id) WHERE loxo_id IS NOT NULL
);

-- Create candidate_embeddings table (vector storage)
CREATE TABLE candidate_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  embedding_type TEXT NOT NULL CHECK (embedding_type IN ('profile', 'cv_chunk', 'skills', 'experience')),
  content_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  chunk_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(candidate_id, embedding_type, content_hash)
);

-- Create phone_numbers table (Apollo structured phone data)
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  raw_number TEXT NOT NULL,
  sanitized_number TEXT,
  phone_type TEXT,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'no_status',
  dnc_status TEXT,
  dnc_other_info TEXT,
  source TEXT DEFAULT 'apollo',
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(candidate_id, sanitized_number)
);

-- Create candidate_documents table (file management)
CREATE TABLE candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cv', 'cover_letter', 'portfolio', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'in_progress', 'completed', 'failed')),
  parsed_text TEXT,
  extracted_data JSONB,
  upload_source TEXT DEFAULT 'manual',
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create document_chunks table (CV text chunks)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES candidate_documents(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_type TEXT CHECK (chunk_type IN ('summary', 'experience', 'education', 'skills', 'other')),
  embedding VECTOR(768),
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(document_id, chunk_index)
);

-- Create scrape_runs table (import tracking)
CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('apollo', 'loxo')),
  run_type TEXT NOT NULL CHECK (run_type IN ('manual', 'scheduled', 'webhook', 'full_sync', 'incremental_sync')),
  search_query TEXT,
  filters JSONB,
  max_results INTEGER,
  sync_type TEXT CHECK (sync_type IN ('full', 'incremental')),
  last_sync_timestamp TIMESTAMPTZ,
  batch_size INTEGER DEFAULT 500,
  actor_id TEXT,
  actor_run_id TEXT,
  webhook_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_found INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  total_new INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  total_duplicates INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create scrape_run_items table (raw import data)
CREATE TABLE scrape_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  raw_data JSONB NOT NULL,
  data_hash TEXT NOT NULL,
  candidate_id UUID REFERENCES candidates(id),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  processing_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(run_id, data_hash)
);

-- Create embedding_jobs table (queue system)
CREATE TABLE embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('profile', 'cv_chunks', 'full_reindex')),
  priority INTEGER DEFAULT 100,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  job_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create companies table (organization data)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  apollo_id TEXT UNIQUE,
  apollo_raw_data JSONB,
  loxo_id TEXT UNIQUE,
  loxo_raw_data JSONB,
  industry TEXT,
  size_range TEXT,
  founded_year INTEGER,
  location TEXT,
  description TEXT,
  estimated_num_employees INTEGER,
  annual_revenue BIGINT,
  total_funding BIGINT,
  latest_funding_stage TEXT,
  alexa_ranking INTEGER,
  publicly_traded_symbol TEXT,
  publicly_traded_exchange TEXT,
  keywords TEXT[],
  short_description TEXT,
  seo_description TEXT,
  street_address TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_conversations table (AI agent chat system)
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  auto_title_generated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  context_summary TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_messages table (conversation history)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  reasoning_model TEXT,
  token_count INTEGER,
  processing_time_ms INTEGER,
  search_results JSONB,
  actions_taken JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'edited')),
  error_message TEXT,
  reply_to_id UUID REFERENCES chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create all indexes for performance optimization
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_linkedin ON candidates(linkedin_url);
CREATE INDEX idx_candidates_source ON candidates(source);
CREATE INDEX idx_candidates_company ON candidates(current_company);
CREATE INDEX idx_candidates_location ON candidates(city, state, country);
CREATE INDEX idx_candidates_tags ON candidates USING GIN(tags);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_status ON candidates(status, contact_status);
CREATE INDEX idx_candidates_priority ON candidates(priority);
CREATE INDEX idx_candidates_embedding_status ON candidates(embedding_status);
CREATE INDEX idx_candidates_updated_at ON candidates(updated_at);
CREATE INDEX idx_candidates_search_vector ON candidates USING GIN(search_vector);
CREATE INDEX idx_candidates_duplicate ON candidates(duplicate_of) WHERE duplicate_of IS NOT NULL;
CREATE INDEX idx_candidates_departments ON candidates USING GIN(departments);
CREATE INDEX idx_candidates_functions ON candidates USING GIN(functions);
CREATE INDEX idx_candidates_apollo_seniority ON candidates(apollo_seniority);
CREATE INDEX idx_candidates_is_likely_to_engage ON candidates(is_likely_to_engage);
CREATE INDEX idx_candidates_photo_url ON candidates(photo_url) WHERE photo_url IS NOT NULL;

CREATE INDEX idx_candidate_embeddings_candidate_id ON candidate_embeddings(candidate_id);
CREATE INDEX idx_candidate_embeddings_type ON candidate_embeddings(embedding_type);
CREATE INDEX idx_candidate_embeddings_vector ON candidate_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_phone_numbers_candidate_id ON phone_numbers(candidate_id);
CREATE INDEX idx_phone_numbers_type ON phone_numbers(phone_type);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);

CREATE INDEX idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);
CREATE INDEX idx_candidate_documents_type ON candidate_documents(document_type);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_candidate_id ON document_chunks(candidate_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_scrape_runs_source ON scrape_runs(source);
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX idx_scrape_runs_started_at ON scrape_runs(started_at);

CREATE INDEX idx_scrape_run_items_run_id ON scrape_run_items(run_id);
CREATE INDEX idx_scrape_run_items_candidate_id ON scrape_run_items(candidate_id);
CREATE INDEX idx_scrape_run_items_status ON scrape_run_items(processing_status);

CREATE INDEX idx_embedding_jobs_status_priority ON embedding_jobs(status, priority DESC, created_at);
CREATE INDEX idx_embedding_jobs_candidate_id ON embedding_jobs(candidate_id);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_apollo_id ON companies(apollo_id);
CREATE INDEX idx_companies_loxo_id ON companies(loxo_id);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_chat_conversations_tags ON chat_conversations USING GIN(tags);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_status ON chat_messages(status);

-- Create trigger function for search vector
CREATE OR REPLACE FUNCTION update_candidates_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.full_name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.current_title, '') || ' ' ||
    COALESCE(NEW.current_company, '') || ' ' ||
    COALESCE(NEW.headline, '') || ' ' ||
    COALESCE(array_to_string(NEW.skills, ' '), '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.industry, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
CREATE TRIGGER update_candidates_search_vector_trigger
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_candidates_search_vector();

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_candidates(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  full_name text,
  current_title text,
  current_company text,
  email text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.full_name,
    c.current_title,
    c.current_company,
    c.email,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM candidates c
  JOIN candidate_embeddings ce ON c.id = ce.candidate_id
  WHERE ce.embedding_type = 'profile'
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
    AND c.status = 'active'
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Set up Row Level Security policies
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on user roles)
CREATE POLICY "Enable read access for authenticated users" ON candidates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON candidate_embeddings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;