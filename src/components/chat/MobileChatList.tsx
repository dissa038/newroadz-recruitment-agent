"use client"

import { useState } from 'react'
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageCircle,
  Plus
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

interface MobileChatListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  isLoadingConversations: boolean
  shouldDisableNewChat: boolean
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (id: string) => void
  onCreateNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
}

export function MobileChatList({
  conversations,
  selectedConversationId,
  isLoadingConversations,
  shouldDisableNewChat,
  isOpen,
  onClose,
  onSelectConversation,
  onCreateNewConversation,
  onDeleteConversation,
  onRenameConversation
}: MobileChatListProps) {
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    onClose() // Close modal after selection
  }

  const handleCreateNew = () => {
    onCreateNewConversation()
    onClose() // Close modal after creation
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[85vh]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b bg-card/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateNew}
            disabled={shouldDisableNewChat}
            className="h-9 px-3 hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Chat
          </Button>

          <h2 className="font-semibold text-xl">Chats</h2>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {isLoadingConversations ? (
              <div className="p-4 space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-4 rounded-lg animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-8 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nog geen gesprekken</h3>
                <p className="text-muted-foreground mb-6">
                  Begin je eerste gesprek om te starten
                </p>
                <Button 
                  onClick={handleCreateNew} 
                  disabled={shouldDisableNewChat}
                  className="w-full disabled:opacity-50"
                  title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Chat
                </Button>
              </div>
            ) : (
              <div className="p-2 relative z-[9999]">
                <ChatList
                  conversations={conversations}
                  selectedConversationId={selectedConversationId}
                  sidebarCollapsed={false}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={onDeleteConversation}
                  onRenameConversation={onRenameConversation}
                />
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Modal>
  )
}
