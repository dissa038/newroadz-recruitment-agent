"use client"

import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownRenderer } from './MarkdownRenderer'
import {
  Bot,
  User,
  Loader2
} from "lucide-react"

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  selectedConversationId: string | null
}

export function ChatMessages({ messages, isLoading, selectedConversationId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Check if user is near bottom of scroll area
  const checkScrollPosition = () => {
    if (!scrollAreaRef.current) return

    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollElement) return

    const { scrollTop, scrollHeight, clientHeight } = scrollElement
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    setShouldAutoScroll(isNearBottom)
    setIsUserScrolling(!isNearBottom)
  }

  // Auto-scroll to bottom when new messages arrive, but only if user is near bottom
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement && messagesEndRef.current) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth'
          })
        }
      })
    }
  }, [messages, shouldAutoScroll, isUserScrolling])

  // Reset scroll behavior when switching conversations
  useEffect(() => {
    setShouldAutoScroll(true)
    setIsUserScrolling(false)

    // Scroll to bottom immediately when switching conversations
    if (selectedConversationId) {
      // Use a longer delay for conversation switching to ensure messages are loaded
      const timeoutId = setTimeout(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'instant'
          })
        }
      }, 200)

      return () => clearTimeout(timeoutId)
    }
  }, [selectedConversationId])

  if (!selectedConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">AI Recruitment Assistent</h1>
          <p className="text-muted-foreground mb-6">
            Begin een gesprek om kandidaten te zoeken, pipelines te analyseren en outreach berichten te genereren.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea 
      className="flex-1 p-4" 
      ref={scrollAreaRef}
      onScrollCapture={checkScrollPosition}
    >
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Begin een gesprek</h3>
          <p className="text-muted-foreground">
            Vraag me om kandidaten te zoeken, pipeline te analyseren, of outreach berichten te genereren.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                {message.role === 'user' ? (
                  <AvatarFallback className="bg-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {message.role === 'user' ? 'Jij' : 'AI Assistent'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-muted-foreground">Aan het denken...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  )
}
