import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiService } from '@/lib/ai/gemini'
import { aiLogger } from '@/lib/logger'
import { withRateLimit, chatRateLimiter } from '@/lib/rate-limiter'

const geminiService = new GeminiService()

// Rate limiting wrapper
const rateLimitedHandler = withRateLimit(
  chatRateLimiter,
  (request: Request) => {
    // Use user ID for rate limiting
    const url = new URL(request.url)
    return url.searchParams.get('userId') || 'anonymous'
  }
)

export const POST = rateLimitedHandler(async function(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { conversationId, message, includeContext = true } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    aiLogger.info({ conversationId, userId: user.id }, 'Starting streaming chat response')

    // Create a ReadableStream for server-sent events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now()

          // Add user message to database
          const { data: userMessage, error: userMessageError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              role: 'user',
              content: message,
              status: 'sent'
            })
            .select()
            .single()

          if (userMessageError) {
            throw new Error('Failed to save user message')
          }

          // Get conversation history for context
          let conversationHistory: Array<{ role: string, content: string }> = []
          if (includeContext) {
            const { data: recentMessages } = await supabase
              .from('chat_messages')
              .select('role, content')
              .eq('conversation_id', conversationId)
              .eq('status', 'sent')
              .order('created_at', { ascending: false })
              .limit(10)

            conversationHistory = (recentMessages || [])
              .reverse()
              .map((msg: any) => ({ role: msg.role, content: msg.content }))
          }

          // Search for relevant candidates if the message seems like a search query
          let candidateContext: any[] = []
          let searchResults: any = null
          if (isSearchQuery(message)) {
            try {
              // Use semantic search to find relevant candidates
              const searchResponse = await fetch(`${request.nextUrl.origin}/api/search/semantic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: message,
                  includeActions: true,
                  filters: {}
                })
              })

              if (searchResponse.ok) {
                const searchData = await searchResponse.json()
                if (searchData.success) {
                  candidateContext = searchData.data.candidates.slice(0, 5)
                  searchResults = {
                    total: searchData.data.total,
                    query: searchData.data.query,
                    reasoning: searchData.data.reasoning
                  }
                }
              }
            } catch (searchError) {
              aiLogger.warn({ error: searchError }, 'Failed to perform candidate search')
            }
          }

          // Build recruitment context
          const recruitmentContext = buildRecruitmentContext(message, candidateContext, searchResults, conversationHistory)
          
          // Use regular Gemini service for now (Vercel AI SDK needs more setup)
          const aiResponse = await geminiService.generateChatResponse(message, recruitmentContext)
          const processingTime = Date.now() - startTime

          // Stream the response in chunks
          const responseChunks = aiResponse.response.split(' ')
          for (const chunk of responseChunks) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'chunk', 
                data: chunk + ' ' 
              })}\n\n`)
            )
            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Add AI message to database
          const { data: aiMessage, error: aiMessageError } = await supabase
            .from('chat_messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: aiResponse.response,
              reasoning_model: 'gemini-1.5-pro',
              token_count: aiResponse.tokensUsed,
              processing_time_ms: processingTime,
              search_results: searchResults,
              actions_taken: candidateContext.length > 0 ? { candidateSearch: true } : null,
              status: 'sent'
            })
            .select()
            .single()

          if (aiMessageError || !aiMessage) {
            throw new Error('Failed to save AI message')
          }

          // Send final response with metadata
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'aiResponse', 
              data: {
                ...aiMessage,
                timestamp: new Date(aiMessage.created_at),
                candidates: candidateContext,
                followUpQuestions: generateFollowUpQuestions(message, candidateContext),
                suggestedActions: generateSuggestedActions(candidateContext)
              }
            })}\n\n`)
          )

          // Update conversation metadata
          await supabase
            .from('chat_conversations')
            .update({
              message_count: conversation.message_count + 2,
              last_message_at: new Date().toISOString()
            })
            .eq('id', conversationId)

        } catch (error) {
          aiLogger.error({ error }, 'Error in streaming chat')
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to process message' 
            })}\n\n`)
          )
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error setting up streaming chat')
    return new Response('Internal server error', { status: 500 })
  }
})

/**
 * Build enhanced context for recruitment-specific AI responses
 */
function buildRecruitmentContext(message: string, candidateContext: any[], searchResults: any, conversationHistory: any[]) {
  const context = {
    conversationHistory,
    candidateContext,
    searchResults,
    recruitmentDomain: {
      isSearchQuery: isSearchQuery(message),
      isAnalysisQuery: isAnalysisQuery(message),
      isOutreachQuery: isOutreachQuery(message),
      messageIntent: analyzeMessageIntent(message)
    }
  }

  return context
}

/**
 * Determine if a message is likely a search query
 */
function isSearchQuery(content: string): boolean {
  const searchKeywords = [
    'find', 'search', 'looking for', 'candidates', 'developers', 'engineers',
    'skills', 'experience', 'location', 'company', 'job', 'role', 'position',
    'react', 'javascript', 'python', 'java', 'senior', 'junior', 'mid-level',
    'show me', 'get me', 'need', 'want'
  ]
  
  const lowerContent = content.toLowerCase()
  return searchKeywords.some(keyword => lowerContent.includes(keyword))
}

/**
 * Determine if a message is asking for analysis
 */
function isAnalysisQuery(content: string): boolean {
  const analysisKeywords = [
    'analyze', 'analysis', 'insights', 'trends', 'compare', 'breakdown',
    'statistics', 'metrics', 'performance', 'pipeline', 'market', 'salary',
    'compensation', 'skills gap', 'talent pool'
  ]
  
  const lowerContent = content.toLowerCase()
  return analysisKeywords.some(keyword => lowerContent.includes(keyword))
}

/**
 * Determine if a message is asking for outreach help
 */
function isOutreachQuery(content: string): boolean {
  const outreachKeywords = [
    'outreach', 'email', 'message', 'contact', 'reach out', 'follow up',
    'sequence', 'template', 'personalize', 'engage', 'connect'
  ]
  
  const lowerContent = content.toLowerCase()
  return outreachKeywords.some(keyword => lowerContent.includes(keyword))
}

/**
 * Analyze the intent behind a message
 */
function analyzeMessageIntent(message: string): string {
  if (isSearchQuery(message)) return 'search'
  if (isAnalysisQuery(message)) return 'analysis'
  if (isOutreachQuery(message)) return 'outreach'
  return 'general'
}

/**
 * Generate contextual follow-up questions
 */
function generateFollowUpQuestions(message: string, candidates: any[]): string[] {
  const questions = []

  if (candidates.length > 0) {
    questions.push("Would you like me to generate outreach messages for these candidates?")
    questions.push("Should I analyze the salary expectations for this group?")
    questions.push("Do you want to filter these results further?")
  }

  if (isSearchQuery(message)) {
    questions.push("Would you like to see similar candidates from different locations?")
    questions.push("Should I find candidates with complementary skills?")
  }

  return questions.slice(0, 3) // Limit to 3 questions
}

/**
 * Generate suggested actions based on candidates
 */
function generateSuggestedActions(candidates: any[]): string[] {
  const actions = []

  if (candidates.length > 0) {
    actions.push("Export candidate list to CSV")
    actions.push("Generate bulk outreach emails")
    actions.push("Create candidate comparison report")
    actions.push("Schedule follow-up reminders")
  }

  return actions
}

/**
 * Generate a conversation title from the first message
 */
function generateConversationTitle(firstMessage: string): string {
  // Extract key terms for title
  const words = firstMessage.trim().split(' ')
  
  // Look for role/skill keywords
  const roleKeywords = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'scientist']
  const techKeywords = ['react', 'python', 'java', 'node', 'frontend', 'backend', 'fullstack']
  
  const foundRoles = words.filter(word => 
    roleKeywords.some(role => word.toLowerCase().includes(role))
  )
  
  const foundTech = words.filter(word => 
    techKeywords.some(tech => word.toLowerCase().includes(tech))
  )

  if (foundRoles.length > 0 || foundTech.length > 0) {
    const title = [...foundTech, ...foundRoles].slice(0, 3).join(' ')
    return title.charAt(0).toUpperCase() + title.slice(1) + ' Search'
  }
  
  // Fallback to first few words
  if (words.length <= 4) {
    return firstMessage
  }
  
  return words.slice(0, 4).join(' ') + '...'
}