// Import the detailed types from our custom types file
import {
  Candidate,
  CandidateInsert,
  CandidateUpdate,
  CandidateEmbedding,
  ChatConversation,
  ChatMessage,
  Company,
  ScrapeRun,
  EmbeddingJob,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Json
} from '../../types/database'

// Re-export the detailed types from our custom types file
export * from '../../types/database'

// Extended Supabase database types to support all tables
export type Database = {
  public: {
    Tables: {
      candidates: {
        Row: Candidate
        Insert: CandidateInsert
        Update: CandidateUpdate
        Relationships: {
          candidate_embeddings: {
            foreignKeyName: "candidate_embeddings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_embeddings"
            referencedColumns: ["id"]
          }
          phone_numbers: {
            foreignKeyName: "phone_numbers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          }
          candidate_documents: {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_documents"
            referencedColumns: ["id"]
          }
        }
      }
      chat_conversations: {
        Row: ChatConversation
        Insert: Omit<ChatConversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ChatConversation, 'id' | 'created_at'>>
        Relationships: {
          chat_messages: {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          }
        }
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
        Relationships: {
          chat_conversations: {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          }
        }
      }
      candidate_embeddings: {
        Row: CandidateEmbedding
        Insert: Omit<CandidateEmbedding, 'id' | 'created_at'>
        Update: Partial<Omit<CandidateEmbedding, 'id' | 'created_at'>>
        Relationships: {
          candidates: {
            foreignKeyName: "candidate_embeddings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        }
      }
      phone_numbers: {
        Row: any // Not defined in database.ts yet
        Insert: any
        Update: any
        Relationships: {
          candidates: {
            foreignKeyName: "phone_numbers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        }
      }
      candidate_documents: {
        Row: any // Not defined in database.ts yet
        Insert: any
        Update: any
        Relationships: {
          candidates: {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        }
      }
      document_chunks: {
        Row: any // Not defined in database.ts yet
        Insert: any
        Update: any
        Relationships: {
          candidate_documents: {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "candidate_documents"
            referencedColumns: ["id"]
          }
        }
      }
      scrape_runs: {
        Row: ScrapeRun
        Insert: Omit<ScrapeRun, 'id' | 'created_at'>
        Update: Partial<Omit<ScrapeRun, 'id' | 'created_at'>>
        Relationships: {
          scrape_run_items: {
            foreignKeyName: "scrape_run_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scrape_run_items"
            referencedColumns: ["id"]
          }
        }
      }
      scrape_run_items: {
        Row: any // Not defined in database.ts yet
        Insert: any
        Update: any
        Relationships: {
          scrape_runs: {
            foreignKeyName: "scrape_run_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scrape_runs"
            referencedColumns: ["id"]
          }
        }
      }
      embedding_jobs: {
        Row: EmbeddingJob
        Insert: Omit<EmbeddingJob, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EmbeddingJob, 'id' | 'created_at'>>
        Relationships: {
          candidates: {
            foreignKeyName: "embedding_jobs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        }
      }
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at'>>
        Relationships: {
          job_positions: {
            foreignKeyName: "job_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          }
        }
      }
      job_positions: {
        Row: any // Not defined in database.ts yet
        Insert: any
        Update: any
        Relationships: {
          companies: {
            foreignKeyName: "job_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        }
      }
      user_profiles: {
        Row: UserProfile
        Insert: UserProfileInsert
        Update: UserProfileUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}