"use client"

import { ChatItem } from './ChatItem'

interface Conversation {
  id: string
  title?: string
  auto_title_generated: boolean
  message_count: number
  last_message_at?: string
  created_at: string
}

interface ChatListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  sidebarCollapsed: boolean
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
}

export function ChatList({
  conversations,
  selectedConversationId,
  sidebarCollapsed,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation
}: ChatListProps) {
  // Sort conversations - newest first (most recent activity)
  const sortedConversations = [...conversations].sort((a, b) => {
    const aTime = a.last_message_at || a.created_at
    const bTime = b.last_message_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="p-2">
      {sortedConversations.map((conversation) => (
        <ChatItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedConversationId === conversation.id}
          isCollapsed={sidebarCollapsed}
          onSelect={() => onSelectConversation(conversation.id)}
          onDelete={() => onDeleteConversation(conversation.id)}
          onRename={(newTitle) => onRenameConversation(conversation.id, newTitle)}
        />
      ))}
    </div>
  )
}
