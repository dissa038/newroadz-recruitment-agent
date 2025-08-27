"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { MobileChatList } from '@/components/chat/MobileChatList'
import { Button } from '@/components/ui/button'
import { MessageCircle, Plus } from 'lucide-react'

interface Conversation {
  id: string
  title?: string
  auto_title_generated: boolean
  message_count: number
  last_message_at?: string
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  candidates?: any[]
}

export default function ChatPage() {
  const { user } = useAuth()
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileChatListOpen, setIsMobileChatListOpen] = useState(false)
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
    } else {
      setMessages([])
    }
  }, [selectedConversationId])

  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch('/api/chat/conversations')
      const result = await response.json()
      
      if (result.success) {
        setConversations(result.data.conversations)
        if (!selectedConversationId && result.data.conversations.length > 0) {
          setSelectedConversationId(result.data.conversations[0].id)
        }
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon gesprekken niet laden',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingConversations(false)
    }
  }, [selectedConversationId])

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/${conversationId}/messages`)
      const result = await response.json()
      
      if (result.success) {
        const formattedMessages: Message[] = result.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          candidates: msg.search_results?.candidates || []
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon berichten niet laden',
        variant: 'destructive'
      })
    }
  }

  // Check current conversation for logic decisions
  const currentConversation = selectedConversationId ? conversations.find(conv => conv.id === selectedConversationId) : null

  const createNewConversation = useCallback(async () => {
    // Prevent creating multiple new chats
    if (isCreatingNewChat) return

    // If currently in an empty conversation, don't create a new one
    if (currentConversation?.message_count === 0) {
      return
    }

    // Check if there's an empty conversation we can reuse
    const emptyConversation = conversations.find(conv => conv.message_count === 0)
    if (emptyConversation) {
      setSelectedConversationId(emptyConversation.id)
      setMessages([])
      return
    }

    setIsCreatingNewChat(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const result = await response.json()
      if (result.success) {
        // Add new conversation at the top
        const newConversation = result.data
        setConversations(prev => [newConversation, ...prev])
        setSelectedConversationId(newConversation.id)
        setMessages([])
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon gesprek niet aanmaken',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingNewChat(false)
    }
  }, [conversations, isCreatingNewChat, selectedConversationId])

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null)
          setMessages([])
        }
        toast({
          title: "Gelukt",
          description: "Gesprek verwijderd"
        })
      } else {
        toast({
          title: "Fout",
          description: "Kon gesprek niet verwijderen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Fout",
        description: "Kon gesprek niet verwijderen",
        variant: "destructive"
      })
    }
  }

  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      
      if (response.ok) {
        setConversations(prev => 
          prev.map(c => 
            c.id === conversationId 
              ? { ...c, title: newTitle, auto_title_generated: false }
              : c
          )
        )
        toast({
          title: "Gelukt",
          description: "Gesprek hernoemd"
        })
      } else {
        toast({
          title: "Fout",
          description: "Kon gesprek niet hernoemen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
      toast({
        title: "Fout",
        description: "Kon gesprek niet hernoemen",
        variant: "destructive"
      })
    }
  }

  const handleSendMessage = useCallback(async (message: string = inputValue) => {
    if (!message.trim() || isLoading) return
    
    const targetConversationId = selectedConversationId
    if (!targetConversationId) {
      await createNewConversation()
      return
    }

    setInputValue('')
    setIsLoading(true)

    // Add user message optimistically
    const tempId = `temp-${Date.now()}`
    const userMessage: Message = {
      id: tempId,
      conversation_id: targetConversationId,
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(`/api/chat/${targetConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          includeContext: true
        })
      })

      const result = await response.json()

      if (result.success) {
        const { userMessage: actualUserMessage, aiMessage, candidateContext } = result.data
        
        const formattedUserMessage: Message = {
          ...actualUserMessage,
          timestamp: new Date(actualUserMessage.created_at)
        }
        
        const formattedAiMessage: Message = {
          ...aiMessage,
          timestamp: new Date(aiMessage.created_at),
          candidates: candidateContext || []
        }
        
        setMessages(prev => {
          const withoutTemp = prev.filter(msg => msg.id !== tempId)
          return [...withoutTemp, formattedUserMessage, formattedAiMessage]
        })
        
        // Update conversation list - move to top
        setConversations(prev => {
          const updated = prev.map(conv =>
            conv.id === targetConversationId
              ? {
                  ...conv,
                  message_count: conv.message_count + 2,
                  last_message_at: aiMessage.created_at,
                  // Update title if it was auto-generated (first message)
                  ...(conv.message_count === 0 && result.data.conversationTitle ? {
                    title: result.data.conversationTitle,
                    auto_title_generated: true
                  } : {})
                }
              : conv
          )
          // Sort to put the updated conversation at the top
          return updated.sort((a, b) => {
            const aTime = a.last_message_at || a.created_at
            const bTime = b.last_message_at || b.created_at
            return new Date(bTime).getTime() - new Date(aTime).getTime()
          })
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      
      toast({
        title: 'Fout',
        description: 'Kon bericht niet verzenden. Probeer opnieuw.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, selectedConversationId, isLoading, createNewConversation])

  const currentMessages = selectedConversationId 
    ? messages.filter(m => m.conversation_id === selectedConversationId)
    : []

  // Check if we should disable "new chat" buttons
  // Only disable if: creating a new chat, OR currently in an empty conversation
  const shouldDisableNewChat = isCreatingNewChat || (currentConversation?.message_count === 0)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          isLoadingConversations={isLoadingConversations}
          sidebarCollapsed={sidebarCollapsed}
          shouldDisableNewChat={shouldDisableNewChat}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectConversation={setSelectedConversationId}
          onCreateNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
        />
      </div>

      {/* Mobile Chat List Modal */}
      <MobileChatList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        isLoadingConversations={isLoadingConversations}
        shouldDisableNewChat={shouldDisableNewChat}
        isOpen={isMobileChatListOpen}
        onClose={() => setIsMobileChatListOpen(false)}
        onSelectConversation={setSelectedConversationId}
        onCreateNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header - Only visible on mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileChatListOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chats</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={createNewConversation}
            disabled={shouldDisableNewChat}
            className="h-8 w-8 p-0 disabled:opacity-50"
            title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ChatMessages
          messages={currentMessages}
          isLoading={isLoading}
          selectedConversationId={selectedConversationId}
        />

        <ChatInput
          inputValue={inputValue}
          isLoading={isLoading}
          hasSelectedConversation={!!selectedConversationId}
          shouldDisableNewChat={shouldDisableNewChat}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          onCreateNewConversation={createNewConversation}
        />
      </div>
    </div>
  )
}
