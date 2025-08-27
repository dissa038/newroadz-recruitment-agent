import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiService } from '@/lib/ai/gemini'
import { aiLogger } from '@/lib/logger'

const geminiService = new GeminiService()

// GET /api/chat/[id]/messages - Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      aiLogger.error({ error: messagesError, conversationId: id }, 'Failed to fetch messages')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages: messages || []
      }
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error fetching chat messages')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[id]/messages - Send message and get AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const conversationId = id
    const { content, includeContext = true } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    aiLogger.info({ conversationId, userId: user.id, messageLength: content.length }, 'Processing chat message')

    // Add user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content,
        status: 'sent'
      })
      .select()
      .single()

    if (userMessageError) {
      aiLogger.error({ error: userMessageError, conversationId }, 'Failed to save user message')
      return NextResponse.json(
        { success: false, error: 'Failed to save message' },
        { status: 500 }
      )
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

    console.log(`🔄 Starting AI response generation for conversation ${conversationId}`)
    console.log(`📝 User message: "${content}"`)
    console.log(`📚 Conversation history: ${conversationHistory.length} messages`)

    // Generate AI response with enhanced RAG
    const startTime = Date.now()
    const aiResponse = await geminiService.generateChatResponse(content, {
      conversationHistory,
      candidateContext: [], // Will be populated by RAG if needed
      searchResults: null
    })
    const processingTime = Date.now() - startTime

    console.log(`✅ AI response generated in ${processingTime}ms`)
    console.log(`🎯 Candidates found: ${aiResponse.candidates?.length || 0}`)
    console.log(`🧠 Tokens used: ${aiResponse.tokensUsed}`)

    // Add AI message
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.response,
        reasoning_model: 'gemini-1.5-pro',
        token_count: aiResponse.tokensUsed,
        processing_time_ms: processingTime,
        search_results: aiResponse.candidates ? {
          total: aiResponse.candidates.length,
          candidates: aiResponse.candidates.map(c => ({
            id: c.id,
            name: c.full_name,
            title: c.current_title,
            company: c.current_company,
            skills: c.skills
          }))
        } : null,
        actions_taken: aiResponse.candidates?.length ? { 
          ragSearch: true, 
          candidatesFound: aiResponse.candidates.length 
        } : null,
        status: 'sent'
      })
      .select()
      .single()

    if (aiMessageError) {
      aiLogger.error({ error: aiMessageError, conversationId }, 'Failed to save AI message')
      return NextResponse.json(
        { success: false, error: 'Failed to save AI response' },
        { status: 500 }
      )
    }

    // Generate title if this is the first exchange and no title exists
    let shouldGenerateTitle = false
    if (!conversation.title && conversation.message_count === 0) {
      shouldGenerateTitle = true
    }

    // Update conversation metadata
    const updateData: any = {
      message_count: conversation.message_count + 2,
      last_message_at: new Date().toISOString()
    }

    // Generate title if needed
    if (shouldGenerateTitle) {
      try {
        const generatedTitle = await geminiService.generateConversationTitle(content, aiResponse.response)
        updateData.title = generatedTitle
        updateData.auto_title_generated = true
        console.log(`🏷️ Generated conversation title: "${generatedTitle}"`)
      } catch (error) {
        console.error('Failed to generate conversation title:', error)
        // Continue without title - not critical
      }
    }

    await supabase
      .from('chat_conversations')
      .update(updateData)
      .eq('id', conversationId)

    aiLogger.info({ 
      conversationId, 
      processingTime,
      candidateCount: aiResponse.candidates?.length || 0,
      tokensUsed: aiResponse.tokensUsed
    }, 'Chat message processed successfully')

    return NextResponse.json({
      success: true,
      data: {
        userMessage: {
          ...userMessage,
          timestamp: new Date(userMessage.created_at)
        },
        aiMessage: {
          ...aiMessage,
          timestamp: new Date(aiMessage.created_at)
        },
        candidateContext: aiResponse.candidates || [],
        searchResults: aiResponse.reasoning ? {
          reasoning: aiResponse.reasoning,
          total: aiResponse.candidates?.length || 0
        } : null,
        // Include the generated title if one was created
        conversationTitle: shouldGenerateTitle ? updateData.title : undefined
      }
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error processing chat message')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}