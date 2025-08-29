"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus,
  MessageCircle,
  ChevronLeft,
  Menu
} from "lucide-react"
import { ChatList } from './ChatList'

interface Conversation {
  id: string
  title?: string
  auto_title_generated: boolean
  message_count: number
  last_message_at?: string
  created_at: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  isLoadingConversations: boolean
  sidebarCollapsed: boolean
  shouldDisableNewChat: boolean
  onToggleSidebar: () => void
  onSelectConversation: (id: string) => void
  onCreateNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
}

export function ChatSidebar({
  conversations,
  selectedConversationId,
  isLoadingConversations,
  sidebarCollapsed,
  shouldDisableNewChat,
  onToggleSidebar,
  onSelectConversation,
  onCreateNewConversation,
  onDeleteConversation,
  onRenameConversation
}: ChatSidebarProps) {
  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 border-r bg-card flex flex-col relative`}>
      {/* Header */}
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateNewConversation}
              disabled={shouldDisableNewChat}
              className="h-8 disabled:opacity-50"
              title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe chat
            </Button>
          )}

          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className={`h-8 w-8 p-0 ${sidebarCollapsed ? 'mx-auto' : 'ml-2'}`}
          >
            {sidebarCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoadingConversations ? (
          <div className="p-4 space-y-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            {!sidebarCollapsed && (
              <p className="text-sm text-muted-foreground">Nog geen gesprekken</p>
            )}
          </div>
        ) : (
          <ChatList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            sidebarCollapsed={sidebarCollapsed}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
            onRenameConversation={onRenameConversation}
          />
        )}
      </ScrollArea>

      {/* Collapsed state new chat button */}
      {sidebarCollapsed && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNewConversation}
            disabled={shouldDisableNewChat}
            className="w-full h-10 hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
