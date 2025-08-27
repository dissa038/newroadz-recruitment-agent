# **🧠 Newroads Recruitment Agent \- COMPREHENSIVE PLAN**

Bouw een eigen sourcing- en searchplatform voor **Newroads recruitment agent** waarin je:

* ✅ Kandidaten binnenhaalt uit Loxo \+ Apollo (via Apify)  
* ✅ Kandidaten kunt uploaden via CV's (PDF, DOCX)  
* ✅ Alles automatisch embed, ontdubbelt en indexeert  
* ✅ AI-agent gebruikt voor search, acties en reasoning  
* ✅ Alles draait in Next.js \+ Supabase, 100% in eigen beheer

## **⚙️ TECH STACK**

| Component | Stack / Tool |
| :---- | :---- |
| UI & Frontend | Next.js 14 (App Router) \+ Tailwind CSS |
| Auth | Supabase Auth (JWT-based) |
| Backend | Vercel Functions (via /api) |
| Database | Supabase (PostgreSQL) |
| Vector DB | pgvector in Supabase |
| Embedding | Google Gemini text-embedding-001 |
| AI Reasoning | Google Gemini 2.5 Pro |
| Scraping | Apify Apollo Scraper |
| File Storage | Supabase Storage (bucket: candidate-cv) |
| Cron jobs | Vercel Cron (bijv. dagelijks om 06:00) |

## **🏗️ FOUNDATIONAL STARTER TEMPLATE**

Dit project wordt gebouwd binnen de volgende **Next.js 15 AI-Ready Starter Template**. De AI-agent moet zich bewust zijn van deze bestaande structuur en features om dubbel werk te voorkomen.

**Stack**: Next.js 15 \+ React 19 \+ TypeScript \+ Tailwind \+ shadcn/ui \+ Supabase \+ Framer Motion

**Architecture**:

* **App Router** with RSC pattern  
* **Provider-based auth** (AuthProvider) \- works out-of-the-box with demo mode  
* **Modern UI** \- 50+ shadcn components, dark/light theme, responsive  
* **Form handling** \- React Hook Form \+ Zod validation  
* **Ready integrations** \- Supabase (auth/db), Google Gemini AI, Brevo email

**Key Features**:

* ✅ **Zero-config startup** \- npm install && npm run dev \= works instantly  
* ✅ **Simple auth UI** \- Login button → form → account page (no complex dropdowns)  
* ✅ **AI/API ready** \- Pre-built routes in /app/api/ for AI, email, contact  
* ✅ **Template philosophy** \- Essential features only, easy to extend with AI

**Perfect for**: Rapid AI-assisted app development where you need solid foundation but want to focus on building features, not boilerplate.

## **🗄️ OPTIMALE DATABASE STRUCTUUR**

### **🔹 candidates (Main Table \- Unified Schema)**

Geoptimaliseerd voor Loxo, Apollo EN custom CV uploads:

```

CREATE TABLE candidates (
  -- Primary Keys & Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- Apollo/Loxo ID
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
  current_company_id TEXT, -- Apollo organization_id
  headline TEXT, -- Professional summary/bio
  seniority_level TEXT, -- 'junior', 'mid', 'senior', 'executive', 'c-level'
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
  email_status TEXT, -- 'verified', 'unverified', 'invalid'
  apollo_confidence_score FLOAT,
  is_likely_to_engage BOOLEAN DEFAULT false,
  extrapolated_email_confidence FLOAT,

  -- CRITICAL: Missing Apollo categorization fields
  departments TEXT[], -- ['c_suite', 'information_technology', etc.]
  subdepartments TEXT[], -- ['executive', 'founder', etc.]
  functions TEXT[], -- ['entrepreneurship', 'operations', etc.]
  apollo_seniority TEXT, -- 'founder', 'c_suite', 'senior', etc.

  -- Additional Apollo fields for rich context
  photo_url TEXT,
  intent_strength FLOAT,
  show_intent BOOLEAN DEFAULT false,
  revealed_for_current_team BOOLEAN DEFAULT false,

  -- Loxo-specific fields
  loxo_id TEXT,
  loxo_contact_id TEXT,
  loxo_profile_score FLOAT,
  loxo_tags TEXT[], -- Loxo internal tags

  -- Contact & Outreach
  email_deliverable BOOLEAN,
  phone_verified BOOLEAN,
  contact_quality_score FLOAT, -- 0-1 quality indicator
  last_contact_date TIMESTAMPTZ,
  contact_status TEXT DEFAULT 'new' CHECK (contact_status IN ('new', 'contacted', 'responded', 'interested', 'not_interested', 'hired')),

  -- CV & Documents
  cv_file_url TEXT, -- Supabase Storage URL
  cv_file_name TEXT,
  cv_uploaded_at TIMESTAMPTZ,
  cv_parsed_text TEXT, -- Full text from CV

  -- Skills & Qualifications
  skills TEXT[], -- Array of skills
  certifications TEXT[], -- Professional certifications
  education JSONB, -- Structured education data
  languages TEXT[], -- Spoken languages

  -- Recruitment Meta
  tags TEXT[] DEFAULT '{}', -- Custom tags for categorization
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hired', 'blacklisted')),
  salary_expectation TEXT,
  availability TEXT, -- 'immediate', '2_weeks', '1_month', 'not_looking'
  remote_preference TEXT, -- 'remote', 'hybrid', 'onsite', 'flexible'

  -- Engagement Tracking
  profile_views INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  engagement_score FLOAT DEFAULT 0, -- Calculated engagement metric

  -- Deduplication
  deduplicated BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES candidates(id),
  duplicate_confidence FLOAT,

  -- Embedding & Search
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'in_progress', 'completed', 'failed')),
  last_embedded_at TIMESTAMPTZ,
  search_vector tsvector, -- Full-text search

  -- Rich Data (JSONB for flexibility)
  employment_history JSONB, -- Work experience
  apollo_raw_data JSONB, -- Full Apollo payload
  loxo_raw_data JSONB, -- Full Loxo payload
  custom_fields JSONB, -- Client-specific custom fields
  social_profiles JSONB, -- Additional social media

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ, -- Last sync with external source

  -- Constraints
  UNIQUE(email, source), -- Allow same email from different sources
  UNIQUE(apollo_id) WHERE apollo_id IS NOT NULL,
  UNIQUE(loxo_id) WHERE loxo_id IS NOT NULL
);

-- Indexes for performance
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

-- CRITICAL: New indexes for Apollo categorization (enables fast filtering before vector search)
CREATE INDEX idx_candidates_departments ON candidates USING GIN(departments);
CREATE INDEX idx_candidates_functions ON candidates USING GIN(functions);
CREATE INDEX idx_candidates_apollo_seniority ON candidates(apollo_seniority);
CREATE INDEX idx_candidates_is_likely_to_engage ON candidates(is_likely_to_engage);
CREATE INDEX idx_candidates_photo_url ON candidates(photo_url) WHERE photo_url IS NOT NULL;

-- Full-text search trigger
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

CREATE TRIGGER update_candidates_search_vector_trigger
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_candidates_search_vector();

```

### **🔹 candidate\_embeddings (Vector Storage)**

```

CREATE TABLE candidate_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  embedding_type TEXT NOT NULL CHECK (embedding_type IN ('profile', 'cv_chunk', 'skills', 'experience')),
  content_hash TEXT NOT NULL, -- SHA-256 of content for dedup
  source_text TEXT NOT NULL, -- Original text that was embedded
  embedding VECTOR(768) NOT NULL, -- Gemini embedding dimension
  chunk_index INTEGER, -- For CV chunks
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(candidate_id, embedding_type, content_hash)
);

CREATE INDEX idx_candidate_embeddings_candidate_id ON candidate_embeddings(candidate_id);
CREATE INDEX idx_candidate_embeddings_type ON candidate_embeddings(embedding_type);
CREATE INDEX idx_candidate_embeddings_vector ON candidate_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

```

### **🔹 phone\_numbers (Apollo Structured Phone Data)**

```

CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,

  -- Apollo phone structure
  raw_number TEXT NOT NULL,
  sanitized_number TEXT,
  phone_type TEXT, -- 'work_hq', 'mobile', 'work_direct', etc.
  position INTEGER DEFAULT 0,

  -- Status tracking
  status TEXT DEFAULT 'no_status', -- 'verified', 'invalid', 'no_status'
  dnc_status TEXT, -- Do Not Call status
  dnc_other_info TEXT,

  -- Source tracking
  source TEXT DEFAULT 'apollo', -- 'apollo', 'loxo', 'manual'
  confidence_score FLOAT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(candidate_id, sanitized_number)
);

CREATE INDEX idx_phone_numbers_candidate_id ON phone_numbers(candidate_id);
CREATE INDEX idx_phone_numbers_type ON phone_numbers(phone_type);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);

```

### **🔹 candidate\_documents (File Management)**

```

CREATE TABLE candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cv', 'cover_letter', 'portfolio', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER,
  mime_type TEXT,

  -- Processing status
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'in_progress', 'completed', 'failed')),
  parsed_text TEXT,
  extracted_data JSONB, -- Structured data from CV parsing

  -- Metadata
  upload_source TEXT DEFAULT 'manual', -- 'manual', 'apollo', 'loxo'
  uploaded_by UUID, -- User who uploaded

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);
CREATE INDEX idx_candidate_documents_type ON candidate_documents(document_type);

```

### **🔹 document\_chunks (CV Text Chunks)**

```

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES candidate_documents(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_type TEXT CHECK (chunk_type IN ('summary', 'experience', 'education', 'skills', 'other')),

  -- Embedding
  embedding VECTOR(768),
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'completed', 'failed')),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_candidate_id ON document_chunks(candidate_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

```

### **🔹 scrape\_runs (Import Tracking)**

```

CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('apollo', 'loxo')),
  run_type TEXT NOT NULL CHECK (run_type IN ('manual', 'scheduled', 'webhook', 'full_sync', 'incremental_sync')),

  -- Configuration
  search_query TEXT,
  filters JSONB, -- Search filters used
  max_results INTEGER,

  -- Sync-specific fields
  sync_type TEXT CHECK (sync_type IN ('full', 'incremental')),
  last_sync_timestamp TIMESTAMPTZ, -- For incremental syncs
  batch_size INTEGER DEFAULT 500,

  -- Apify/Actor info
  actor_id TEXT,
  actor_run_id TEXT,
  webhook_url TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Results
  total_found INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  total_new INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  total_duplicates INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scrape_runs_source ON scrape_runs(source);
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX idx_scrape_runs_started_at ON scrape_runs(started_at);

```

### **🔹 scrape\_run\_items (Raw Import Data)**

```

CREATE TABLE scrape_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,

  -- Raw data
  raw_data JSONB NOT NULL, -- Complete Apollo/Loxo payload
  data_hash TEXT NOT NULL, -- SHA-256 for deduplication

  -- Processing
  candidate_id UUID REFERENCES candidates(id),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  processing_notes TEXT,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(run_id, data_hash)
);

CREATE INDEX idx_scrape_run_items_run_id ON scrape_run_items(run_id);
CREATE INDEX idx_scrape_run_items_candidate_id ON scrape_run_items(candidate_id);
CREATE INDEX idx_scrape_run_items_status ON scrape_run_items(processing_status);

```

### **🔹 embedding\_jobs (Queue System)**

```

CREATE TABLE embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('profile', 'cv_chunks', 'full_reindex')),

  -- Priority & queuing
  priority INTEGER DEFAULT 100, -- Higher = more priority

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,

  -- Error handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Job data
  job_data JSONB, -- Additional context/configuration

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_embedding_jobs_status_priority ON embedding_jobs(status, priority DESC, created_at);
CREATE INDEX idx_embedding_jobs_candidate_id ON embedding_jobs(candidate_id);

```

### **🔹 companies (Organization Data)**

```

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,
  linkedin_url TEXT,

  -- Apollo data
  apollo_id TEXT UNIQUE,
  apollo_raw_data JSONB,

  -- Loxo data
  loxo_id TEXT UNIQUE,
  loxo_raw_data JSONB,

  -- Company details
  industry TEXT,
  size_range TEXT, -- '1-10', '11-50', etc.
  founded_year INTEGER,
  location TEXT,
  description TEXT,

  -- CRITICAL: Apollo financial and growth data for better matching
  estimated_num_employees INTEGER,
  annual_revenue BIGINT,
  total_funding BIGINT,
  latest_funding_stage TEXT, -- 'Series A', 'Series B', etc.
  alexa_ranking INTEGER,
  publicly_traded_symbol TEXT,
  publicly_traded_exchange TEXT,

  -- Rich context data
  keywords TEXT[], -- For semantic company matching
  short_description TEXT,
  seo_description TEXT,
  street_address TEXT,
  postal_code TEXT,

  -- Contact info
  phone TEXT,
  email TEXT,

  -- Metadata
  logo_url TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_apollo_id ON companies(apollo_id);
CREATE INDEX idx_companies_loxo_id ON companies(loxo_id);

```

### **🔹 job\_positions (Optional \- For Matching)**

```

CREATE TABLE job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  description TEXT,

  -- Requirements
  required_skills TEXT[],
  preferred_skills TEXT[],
  min_experience INTEGER,
  max_experience INTEGER,
  seniority_level TEXT,

  -- Location & remote
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,

  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'EUR',

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paused', 'closed', 'filled')),

  -- AI matching
  job_embedding VECTOR(768),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

```

### **🔹 chat\_conversations (AI Agent Chat System)**

```

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- From Supabase Auth

  -- Auto-generated metadata
  title TEXT, -- AI-generated based on first messages
  auto_title_generated BOOLEAN DEFAULT false,

  -- Conversation state
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  message_count INTEGER DEFAULT 0,

  -- Context tracking
  last_message_at TIMESTAMPTZ,
  context_summary TEXT, -- AI-generated summary for long conversations

  -- Search & filtering
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_chat_conversations_tags ON chat_conversations USING GIN(tags);

```

### **🔹 chat\_messages (Conversation History)**

```

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI response metadata
  reasoning_model TEXT, -- 'gemini-2.5-pro', 'gemini-1.5-pro', etc.
  token_count INTEGER,
  processing_time_ms INTEGER,

  -- Search results context (for assistant messages)
  search_results JSONB, -- Candidate matches, companies found, etc.
  actions_taken JSONB, -- Tool calls executed (send_email, add_note, etc.)

  -- Message state
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'edited')),
  error_message TEXT,

  -- Threading & replies
  reply_to_id UUID REFERENCES chat_messages(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_status ON chat_messages(status);

```

## **🤖 SMART DEDUPLICATION & UPDATE ENGINE**

### **🧬 Unified Deduplication & Update Flow**

This logic is central to maintaining a clean database and is applied to **every** candidate import: **Apollo Scrapes, Loxo Syncs, CV Uploads, and Manual Additions**.

1. **Ingest Data**: Receive new candidate data from any source.  
2. **Find Potential Duplicates**: Query the candidates table for existing records that match the new data, in order of confidence:  
   * **Level 1 (High Confidence):** Exact match on linkedin\_url.  
   * **Level 2 (High Confidence):** Exact match on email.  
   * **Level 3 (Medium Confidence):** Fuzzy match on full\_name AND exact match on current\_company.  
   * **Level 4 (Medium Confidence):** Exact match on a verified phone number.  
3. **Decision**:  
   * **If a match is found**:  
     * The existing record is designated the "master" record.  
     * The smartMerge function is triggered to update the master record.  
   * **If no match is found**:  
     * A new candidate record is created.  
4. **Smart Merge Logic**:  
   * The function compares the master record with the new data field by field.  
   * **Rule**: The most recent, non-null data wins. It favors data from sources that are manually verified or have higher confidence scores (e.g., a 'verified' email from Apollo overwrites an older, unverified one).  
   * **Arrays (skills, tags)**: Arrays are merged, and duplicates are removed to create a comprehensive list.  
   * **Raw Data**: The full, original payload from the new source (apollo\_raw\_data or loxo\_raw\_data) is always saved or updated.  
   * The updated\_at and last\_synced\_at timestamps are updated.  
5. **Queue for Embedding**: If the merge process resulted in a change to any core textual data (like headline, skills, employment\_history), a job is added to the embedding\_jobs queue to re-index the candidate's profile.

## **🤖 GEMINI AI INTEGRATION**

### **Why Google Gemini for Complete AI Stack?**

* **Cost Effective**: Significant savings using single provider  
* **Performance**: Best-in-class embeddings (768-dim) \+ reasoning (2.5 Pro)  
* **Multilingual**: Superior Dutch/English support for recruitment  
* **Rate Limits**: Generous limits for production workloads  
* **Unified API**: Single integration for embeddings \+ chat reasoning

## **🧬 ENHANCED CORE FLOWS**

### **🔁 1\. Apollo Scraping Flow (Asynchroon & Robuust)**

```

// 1. Start scrape
POST /api/scrape/apollo/start
{
  "searchUrl": "https://app.apollo.io/...",
  "maxResults": 1000,
  "filters": {
    "location": "Netherlands",
    "title": "Software Engineer",
    "seniority": ["senior", "mid"]
  }
}

// 2. Apify processes → webhook to /api/scrape/apollo/webhook
// 3. Webhook receives a batch of candidates and for each one:
//    - Triggers the "Unified Deduplication & Update Flow"
//    - Queues embedding jobs for new or updated candidates
// 4. Embedding worker processes jobs from the queue in batches

```

### **🔁 2\. Loxo Database Sync Flow (Smart Incremental)**

```

// 1. Start full/incremental sync
POST /api/sync/loxo/start
{
  "syncType": "incremental" | "full",
  "lastSyncTimestamp": "2024-01-01T00:00:00Z", // For incremental
  "batchSize": 500
}

// 2. Loxo API is polled in batches. For each candidate in a batch:
//    - The "Unified Deduplication & Update Flow" is triggered.
//    - This handles both creating new candidates and smart-merging updates into existing ones.
//    - Embedding jobs are queued for any new or significantly changed profiles.

```

### **📤 3\. CV Upload & Processing Flow**

```

// 1. Upload CV via UI
POST /api/upload/cv
FormData: { file, candidateId? }

// 2. Backend parses CV text and extracts key info (name, email, etc.).
// 3. The extracted info is processed by the "Unified Deduplication & Update Flow".
//    - If it matches an existing candidate, the CV is attached to their profile.
//    - If not, a new candidate profile is created with the CV info.
// 4. The parsed CV text is chunked.
// 5. Embedding jobs are queued for each chunk of the CV text.

```

### **🔍 4\. AI Agent Query Flow**

```

// Semantic search + reasoning
POST /api/agent/query
{
  "query": "Find senior React developers in Amsterdam with GraphQL experience",
  "includeActions": true,
  "context": { "jobId": "...", "companyId": "..." }
}

// Response includes:
// - Matched candidates
// - Reasoning
// - Suggested actions
// - Follow-up questions

```

## **🛠️ API ROUTES (Vercel Functions)**

| Route | Functie | Input | Output |
| :---- | :---- | :---- | :---- |
| /api/scrape/apollo/start | Start Apify scrape | Search config | Run ID |
| /api/scrape/apollo/webhook | Process scraped data | Apify payload | Processing status |
| /api/sync/loxo/start | Start Loxo database sync | Sync config | Sync run ID |
| /api/sync/loxo/status | Check sync progress | Run ID | Status & metrics |
| /api/upload/cv | Upload & parse CV | File \+ metadata | Candidate data |
| /api/agent/query | AI search & reasoning | Natural language query | Results \+ actions |
| /api/chat/conversations | Manage chat conversations | User ID | Conversation list |
| /api/chat/\[id\]/messages | Chat messages | Conversation ID | Message history |
| /api/chat/\[id\]/send | Send message to AI | Message content | AI response |
| /api/embed/queue/run | Process embedding jobs | Batch config | Processed count |
| /api/candidates/search | Vector \+ text search | Search params | Candidates |
| /api/candidates/\[id\] | Get candidate details | Candidate ID | Full profile |
| /api/dedup/check | Deduplication check | Candidate data | Duplicate matches |

## **🖥️ ADMIN UI PAGES**

| Pagina | Functie | Features |
| :---- | :---- | :---- |
| /dashboard | Overview & metrics | Stats, recent activity, quick actions |
| /candidates | Search & filter | Vector search, filters, bulk actions |
| /candidates/\[id\] | Candidate profile | Full details, CV viewer, notes, actions |
| /candidates/upload | CV upload interface | Drag & drop, batch upload, progress |
| /chat | AI agent interface | Multi-conversation chat, auto-titles, context |
| /chat/\[id\] | Specific conversation | Message history, candidate context, actions |
| /scraping | Scrape management | Start scrapes, monitor progress, logs |
| /sync | Sync management | Start Loxo sync, view progress, see logs |
| /admin/embeddings | Embedding queue | Job status, retry failed, metrics |
| /admin/duplicates | Deduplication | Review matches, merge candidates |
| /settings | Configuration | API keys, embedding settings, users |

## **🔧 DEVELOPMENT FILE STRUCTURE (REVISED)**

The structure is organized by feature, with each page-level route containing its own components directory for better co-location and maintainability.

```

src/
├── app/
│   ├── api/                # API Routes (Vercel Functions)
│   │   ├── sync/loxo/
│   │   ├── scrape/apollo/
│   │   ├── chat/
│   │   └── ...
│   ├── chat/               # Chat page route
│   │   ├── [id]/page.tsx
│   │   ├── components/       # Components specific to the chat page
│   │   │   ├── ChatWindow.tsx
│   │   │   └── MessageList.tsx
│   │   └── page.tsx
│   ├── candidates/         # Candidates page route
│   │   ├── [id]/page.tsx
│   │   ├── components/       # Components for the candidates page
│   │   │   ├── CandidateTable.tsx
│   │   │   └── SearchFilters.tsx
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── components/
│   │   └── page.tsx
│   └── ...                 # Other top-level routes
├── components/
│   ├── ui/                 # Global, reusable UI components (ShadCN)
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── shared/             # Global, complex shared components
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── lib/                    # Core logic, services, and utilities
│   ├── supabase/           # Supabase client and helpers
│   ├── gemini/             # Gemini AI services
│   ├── apollo/             # Apollo/Apify integration logic
│   ├── loxo/               # Loxo API client
│   └── utils/              # General utility functions
├── types/                  # TypeScript definitions
└── tests/                  # Test files

```

## **✅ COMPLETE ENVIRONMENT VARIABLES**

### **🔑 Required .env.local Configuration**

```

# Database & Authentication (Supabase Only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# AI Services (Google Gemini - Single Provider)
GOOGLE_AI_API_KEY=your-google-ai-api-key  # For both embeddings and reasoning

# External Data Sources
APIFY_TOKEN=apify_api_your-token
APOLLO_ACTOR_ID=code_crafter/apollo-scraper
LOXO_API_KEY=your-loxo-api-key
LOXO_API_BASE_URL=https://api.loxo.co/v1
LOXO_AGENCY_SLUG=your-agency-slug

# Security
WEBHOOK_SECRET=your-webhook-secret-for-apify

# File Storage
SUPABASE_STORAGE_BUCKET=candidate-cv
MAX_FILE_SIZE=10485760  # 10MB in bytes

```

## **🧠 AI AGENT CAPABILITIES & DEVELOPMENT GUIDE**

### **Agent Core Functions**

| Functie | Voorbeeld |
| :---- | :---- |
| 🔍 Semantic Search | "Find React developers with 5+ years experience in fintech" |
| 📊 Profile Analysis | "Analyze this candidate's fit for our Senior Developer role" |
| 📝 Smart Summarization | "Summarize the top 5 candidates for this position" |
| 🎯 Skill Matching | "Match candidates to job requirements and score fit" |
| 📧 Outreach Generation | "Generate personalized email for this candidate" |
| 🏷️ Auto-tagging | "Tag candidates by seniority and expertise" |

### **🛠️ Available MCP Servers for Development**

**Your AI agent has access to powerful MCP servers to build this entire system for the project: *Newroads recruitment agent*.**

#### **🕸️ Supabase MCP Server**

* **Project Context**: All database operations pertain to the **Newroads recruitment agent** project.  
* **Full database control**: Create, modify, delete tables, indexes, RLS policies.  
* **Real-time schema management**: Set up pgvector, create all required tables.  
* **Data operations**: Insert, update, query all candidate/chat/company data.  
* **Authentication setup**: Configure Supabase Auth, RLS policies, user management.  
* **Storage management**: Set up buckets, upload policies, file handling.

#### **📚 RefMCP Documentation Server**

* **Complete API documentation access**: Apollo, Loxo, Next.js, Supabase, Google AI.  
* **Real-time documentation lookup**: Always get latest API specifications.  
* **Implementation examples**: Code samples for integrations.  
* **Best practices**: Official guidelines for each service.  
* **Crawled Loxo Documentation**: For detailed Loxo API information, the agent can use the **Archon MCP** to access the pre-crawled documentation.

### **💻 Development Workflow**

1. **Database Setup (via Supabase MCP)**:  
   * Use Supabase MCP to execute the CREATE TABLE and CREATE INDEX SQL statements from the "Optimale Database Structuur" section for the **Newroads recruitment agent** project.  
   * Enable the pgvector extension.  
   * Configure Row Level Security (RLS) policies for user-specific data access.  
   * Set up the candidate-cv storage bucket with appropriate access policies.  
2. **API Integration (via RefMCP & Archon MCP)**:  
   * Use RefMCP to look up the exact API specifications for Apollo (via Apify actor).  
   * Use **Archon MCP** to query the crawled Loxo API documentation for endpoints, parameters, and data structures.  
   * Consult RefMCP for Google Gemini integration examples for generating embeddings and handling chat reasoning.  
   * Verify Next.js API route patterns and Supabase client best practices.  
3. **Component & Logic Development**:  
   * Build the frontend components as defined in the file structure, starting from the provided template.  
   * Implement the core backend logic in the API routes, using information from the MCP servers to correctly handle external API calls.  
   * Implement the SmartDeduplicationEngine and the structured logging service.  
4. **Project Planning & Status Tracking (planning.md)**:  
   * To maintain clarity and track progress, the AI agent **must** create and continuously update a file named planning.md in the root directory of the project.  
   * This file serves as a high-level project log and should contain:  
     * **✅ Completed Tasks**: A checklist of major features or steps that have been successfully implemented (e.g., "Database schema created", "Apollo webhook API endpoint built").  
     * **⏳ To-Do**: A prioritized list of the next major tasks to be executed.  
     * **⚠️ Issues & Deviations**: A brief log of any problems encountered, unexpected behavior, or deviations from this plan.  
   * The agent must keep this file concise and up-to-date after completing each significant development step.

## **🎯 MVP IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Week 1-2)**

* ✅ Supabase project setup \+ pgvector (via Supabase MCP)  
* ✅ Database schema implementation (via Supabase MCP)  
* ✅ Basic Next.js app \+ authentication  
* ✅ **Unified Deduplication & Update Service** implementation

### **Phase 2: Core Features (Week 3-4)**

* ✅ Apollo scraper webhook integration (API logic via RefMCP)  
* ✅ CV upload & parsing flow  
* ✅ Loxo sync (incremental & full) (API logic via Archon MCP)  
* ✅ Embedding pipeline for all sources (Gemini logic via RefMCP)

### **Phase 3: AI Agent & UI (Week 5-6)**

* ✅ Gemini integration for reasoning  
* ✅ Semantic search API endpoint  
* ✅ Basic candidate search UI  
* ✅ Chat interface

### **Phase 4: Polish & Production (Week 7-8)**

* ✅ Admin interfaces for syncs and queues  
* ✅ Bulk actions on candidates  
* ✅ Comprehensive error handling & monitoring implementation  
* ✅ Performance optimization

## **📈 LOGGING, MONITORING & ERROR TRACKING**

### **Gestructureerde Logging (Structured Logging)**

Voor een robuust systeem is console.log() niet voldoende. We implementeren gestructureerde, machine-leesbare logs (JSON-formaat). Dit is essentieel voor het debuggen van complexe, asynchrone processen zoals de Loxo-sync of Apollo-webhooks.

* **Tool:** We gebruiken pino, een zeer performante, lichtgewicht logger voor Node.js.  
* **Implementatie:** Er wordt een centrale logger-service opgezet in lib/logger.ts. Elke serverless functie importeert en gebruikt deze logger om consistente, contextrijke logs te genereren.

**Voorbeeld: Logger in een API-route**

```

// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});


// src/app/api/scrape/apollo/webhook/route.ts
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const webhookData = await req.json();
  const runId = webhookData.actorRunId;

  // Maak een child logger met context voor deze specifieke run
  const log = logger.child({ runId: runId, source: 'apollo_webhook' });

  log.info('Webhook received');

  try {
    for (const candidateData of webhookData.people) {
      log.info({ candidateId: candidateData.id }, 'Processing candidate...');
      // ... deduplication and update logic ...
      log.info({ candidateId: candidateData.id }, 'Candidate processed successfully');
    }
    log.info('Webhook processed successfully');
    return Response.json({ status: 'ok' });
  } catch (error) {
    log.error({ err: error }, 'Failed to process webhook');
    return Response.json({ status: 'error' }, { status: 500 });
  }
}

```

### **Error Tracking & Monitoring**

* **Error Tracking:** We integreren **Sentry**. Dit geeft ons real-time alerts en gedetailleerde stack traces wanneer er onverwachte fouten optreden in de Vercel Functions, wat essentieel is voor proactief onderhoud.  
* **Monitoring:** We gebruiken:  
  * **Vercel Analytics:** Voor het monitoren van de performance van de API-routes en de frontend.  
  * **Supabase Dashboard:** Voor het in de gaten houden van de database-performance, query-tijden en resource-gebruik.  
  * **Google AI Studio:** Om het verbruik van de Gemini API te monitoren en kosten-alerts in te stellen.

## **🔚 EINDRESULTAAT**

Een volledig geautomatiseerd recruitment platform dat:

* 📚 **Centrale, ontdubbelde database** van alle kandidaten (Apollo, Loxo, CV uploads)  
* 🧠 **AI-powered search** met semantische begrippen  
* 🤖 **Intelligente agent** voor reasoning en acties  
* 🔁 **Robuuste, automatische sourcing** pipeline  
* 💾 **Document management** met originele bestanden  
* 🏗️ **Schaalbaar & uitbreidbaar** voor groeiende datasets  
* 🔒 **Privacy-compliant** met GDPR ondersteuning

Het platform groeit mee met je recruitment needs en blijft volledig onder eigen beheer voor maximale controle en flexibiliteit.
