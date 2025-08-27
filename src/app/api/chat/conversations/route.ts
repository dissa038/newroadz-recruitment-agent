import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLogger } from '@/lib/logger'

// GET /api/chat/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get conversations for the user
    const { data: conversations, error, count } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', status)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      aiLogger.error({ error, userId: user.id }, 'Failed to fetch conversations')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversations || [],
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error fetching conversations')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, initialMessage } = await request.json()

    aiLogger.info({ userId: user.id, title }, 'Creating new conversation')

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: title || null,
        auto_title_generated: !title,
        status: 'active',
        message_count: 0
      })
      .select()
      .single()

    if (conversationError) {
      aiLogger.error({ error: conversationError, userId: user.id }, 'Failed to create conversation')
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Add initial message if provided
    if (initialMessage) {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: initialMessage,
          status: 'sent'
        })

      if (messageError) {
        aiLogger.error({ error: messageError, conversationId: conversation.id }, 'Failed to add initial message')
      } else {
        // Update conversation message count
        await supabase
          .from('chat_conversations')
          .update({ 
            message_count: 1,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversation.id)
      }
    }

    aiLogger.info({ conversationId: conversation.id, userId: user.id }, 'Conversation created successfully')

    return NextResponse.json({
      success: true,
      data: conversation
    }, { status: 201 })

  } catch (error) {
    aiLogger.error({ error }, 'Error creating conversation')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}