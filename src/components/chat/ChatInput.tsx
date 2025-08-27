"use client"

import { useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Send, 
  Loader2,
  Plus
} from "lucide-react"

interface ChatInputProps {
  inputValue: string
  isLoading: boolean
  hasSelectedConversation: boolean
  shouldDisableNewChat: boolean
  onInputChange: (value: string) => void
  onSendMessage: (message?: string) => void
  onCreateNewConversation: () => void
}

export function ChatInput({
  inputValue,
  isLoading,
  hasSelectedConversation,
  shouldDisableNewChat,
  onInputChange,
  onSendMessage,
  onCreateNewConversation
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading) {
        onSendMessage()
      }
    }
  }, [inputValue, isLoading, onSendMessage])

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage()
    }
  }, [inputValue, isLoading, onSendMessage])

  if (!hasSelectedConversation) {
    return (
      <div className="p-4 border-t bg-card">
        <Button 
          onClick={onCreateNewConversation} 
          disabled={shouldDisableNewChat}
          className="w-full disabled:opacity-50"
          title={shouldDisableNewChat ? "Je bent al in een lege chat" : "Nieuwe chat"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Chat
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 border-t bg-card">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Typ je bericht..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={!inputValue.trim() || isLoading}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
