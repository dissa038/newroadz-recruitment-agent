import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiService } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'

const geminiService = new GeminiService()
const semanticSearchLogger = logger.child({ service: 'semantic_search' })

// POST /api/search/semantic - Perform semantic search for candidates
export async function POST(request: NextRequest) {
  try {
    const { query, includeActions = false, filters = {} } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }
    
    semanticSearchLogger.info({ query, filters }, 'Starting semantic search')
    
    const supabase = await createClient()
    
    // Generate embedding for the search query
    const queryEmbedding = await geminiService.generateEmbedding(query)
    
    // Perform vector similarity search using the match_candidates function
    const { data: vectorResults, error: vectorError } = await supabase
      .rpc('match_candidates', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 50
      })
    
    if (vectorError) {
      semanticSearchLogger.error({ error: vectorError, query }, 'Vector search failed')
      // Fallback to text search if vector search fails
    }
    
    let candidates = vectorResults || []
    
    // If vector search didn't return results or failed, fallback to text-based search
    if (!candidates.length) {
      // Build the SQL query with text search fallback
      let searchQuery = supabase
        .from('candidates')
        .select('*')
        .limit(50)
        .eq('status', 'active')
      
      // Apply text search
      if (query) {
        searchQuery = searchQuery.textSearch('search_vector', query)
      }
      
      // Apply filters
      if (filters.skills && Array.isArray(filters.skills)) {
        searchQuery = searchQuery.overlaps('skills', filters.skills)
      }
      
      if (filters.location) {
        searchQuery = searchQuery.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
      }
      
      if (filters.seniority_level) {
        searchQuery = searchQuery.eq('seniority_level', filters.seniority_level)
      }
      
      if (filters.company) {
        searchQuery = searchQuery.ilike('current_company', `%${filters.company}%`)
      }
      
      if (filters.source) {
        searchQuery = searchQuery.eq('source', filters.source)
      }
      
      if (filters.status) {
        searchQuery = searchQuery.eq('status', filters.status)
      }
      
      // Execute the fallback search
      const { data: fallbackResults, error: fallbackError } = await searchQuery
      
      if (fallbackError) {
        semanticSearchLogger.error({ error: fallbackError, query }, 'Fallback search failed')
        return NextResponse.json(
          { success: false, error: 'Search failed' },
          { status: 500 }
        )
      }
      
      candidates = fallbackResults || []
    } else {
      // Apply additional filters to vector search results
      if (filters.skills && Array.isArray(filters.skills)) {
        candidates = candidates.filter((c: any) => 
          c.skills && filters.skills!.some((skill: string) => 
            c.skills.includes(skill)
          )
        )
      }
      
      if (filters.location) {
        candidates = candidates.filter((c: any) => 
          c.city?.toLowerCase().includes(filters.location!.toLowerCase()) ||
          c.state?.toLowerCase().includes(filters.location!.toLowerCase()) ||
          c.country?.toLowerCase().includes(filters.location!.toLowerCase())
        )
      }
      
      if (filters.seniority_level) {
        candidates = candidates.filter((c: any) => c.seniority_level === filters.seniority_level)
      }
      
      if (filters.company) {
        candidates = candidates.filter((c: any) => 
          c.current_company?.toLowerCase().includes(filters.company!.toLowerCase())
        )
      }
      
      if (filters.source) {
        candidates = candidates.filter((c: any) => c.source === filters.source)
      }
    }
    
    // Generate AI reasoning and suggested actions if requested
    let reasoning = ''
    let suggestedActions: string[] = []
    let followUpQuestions: string[] = []
    
    if (includeActions && candidates.length > 0) {
      const searchContext = {
        query,
        candidateCount: candidates.length,
        topCandidates: candidates.slice(0, 3).map((c: any) => ({
          name: c.full_name,
          title: c.current_title,
          company: c.current_company,
          skills: c.skills?.slice(0, 5),
          similarity: c.similarity || 'N/A'
        }))
      }
      
      try {
        const aiResponse = await geminiService.reasonAboutQuery(query, {
          candidates: candidates.slice(0, 3),
          searchResults: { total: candidates.length, query }
        })
        reasoning = aiResponse.reasoning
        
        // Generate contextual suggested actions
        suggestedActions = generateSuggestedActions(candidates, query)
        followUpQuestions = generateFollowUpQuestions(candidates, query, filters)
        
      } catch (aiError) {
        semanticSearchLogger.warn({ error: aiError }, 'AI reasoning failed, continuing without it')
        // Provide fallback reasoning
        reasoning = `Found ${candidates.length} candidates matching your criteria. ${candidates.length > 10 ? 'Consider refining your search for more targeted results.' : 'You might want to broaden your search criteria to find more candidates.'}`
      }
    }
    
    semanticSearchLogger.info({ 
      query, 
      candidateCount: candidates.length,
      hasReasoning: !!reasoning,
      searchType: vectorResults ? 'vector' : 'text'
    }, 'Semantic search completed')
    
    return NextResponse.json({
      success: true,
      data: {
        query,
        candidates: candidates,
        total: candidates.length,
        reasoning,
        suggestedActions,
        followUpQuestions,
        searchMetadata: {
          searchType: vectorResults ? 'vector' : 'text',
          filters: filters,
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    semanticSearchLogger.error({ error }, 'Semantic search error')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform semantic search',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate contextual suggested actions based on search results
 */
function generateSuggestedActions(candidates: any[], query: string): string[] {
  const actions = []
  
  if (candidates.length > 5) {
    actions.push('Filter by location')
    actions.push('Filter by experience level')
    actions.push('Sort by match score')
  }
  
  if (candidates.length > 0) {
    actions.push('Export to CSV')
    actions.push('Generate outreach templates')
    actions.push('Create shortlist')
  }
  
  if (candidates.length > 10) {
    actions.push('Analyze salary expectations')
    actions.push('View skill distribution')
  }
  
  return actions.slice(0, 4) // Limit to most relevant actions
}

/**
 * Generate contextual follow-up questions
 */
function generateFollowUpQuestions(candidates: any[], query: string, filters: any): string[] {
  const questions = []
  
  if (candidates.length === 0) {
    questions.push('Should I broaden the search criteria?')
    questions.push('Would you like to search in different locations?')
    questions.push('Should I look for candidates with related skills?')
  } else if (candidates.length > 20) {
    questions.push('Would you like to narrow down by specific technologies?')
    questions.push('Should I filter by company size or type?')
    questions.push('Do you want to focus on candidates open to new opportunities?')
  } else {
    questions.push('Would you like me to find similar candidates?')
    questions.push('Should I generate personalized outreach for these candidates?')
    questions.push('Do you want to see their social profiles and portfolios?')
  }
  
  // Add filter-specific questions
  if (!filters.location) {
    questions.push('Should I focus on specific locations?')
  }
  
  if (!filters.seniority_level) {
    questions.push('Do you have a preference for experience level?')
  }
  
  return questions.slice(0, 3) // Limit to 3 most relevant questions
}