import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiLogger } from '@/lib/logger'

// DELETE /api/chat/conversations/[id] - Delete conversation and all its messages
export async function DELETE(
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

    aiLogger.info({ conversationId: id, userId: user.id }, 'Deleting conversation')

    // Delete all messages in the conversation first
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      aiLogger.error({ error: messagesError, conversationId: id }, 'Failed to delete messages')
      return NextResponse.json(
        { success: false, error: 'Failed to delete conversation messages' },
        { status: 500 }
      )
    }

    // Delete the conversation
    const { error: conversationError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (conversationError) {
      aiLogger.error({ error: conversationError, conversationId: id }, 'Failed to delete conversation')
      return NextResponse.json(
        { success: false, error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    aiLogger.info({ conversationId: id, userId: user.id }, 'Conversation deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error deleting conversation')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/chat/conversations/[id] - Update conversation (e.g., rename)
export async function PATCH(
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

    const { title } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify user owns the conversation and update it
    const { data: conversation, error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        title: title.trim(),
        auto_title_generated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !conversation) {
      if (updateError?.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        )
      }
      
      aiLogger.error({ error: updateError, conversationId: id }, 'Failed to update conversation')
      return NextResponse.json(
        { success: false, error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    aiLogger.info({ conversationId: id, userId: user.id, newTitle: title }, 'Conversation updated')

    return NextResponse.json({
      success: true,
      data: conversation
    })

  } catch (error) {
    aiLogger.error({ error }, 'Error updating conversation')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
