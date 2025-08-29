"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X
} from "lucide-react"
import { format } from "date-fns"

interface Conversation {
  id: string
  title?: string
  auto_title_generated: boolean
  message_count: number
  last_message_at?: string
  created_at: string
}

interface ChatItemProps {
  conversation: Conversation
  isSelected: boolean
  isCollapsed: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

function getConversationTitle(conversation: Conversation): string {
  if (conversation.title) {
    return conversation.title
  }
  return `Nieuwe Chat ${format(new Date(conversation.created_at), 'MMM d')}`
}

export function ChatItem({
  conversation,
  isSelected,
  isCollapsed,
  onSelect,
  onDelete,
  onRename
}: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(getConversationTitle(conversation))

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== getConversationTitle(conversation)) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(getConversationTitle(conversation))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
        isSelected
          ? 'bg-primary/5 border border-primary/10 shadow-sm'
          : 'hover:bg-accent/30'
      }`}
      onClick={!isEditing ? onSelect : undefined}
    >
      {!isCollapsed ? (
        <>
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRename()
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCancelEdit()
                  }}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <h3 className={`font-medium text-sm truncate ${
                    isSelected ? 'text-primary' : ''
                  }`}>
                    {getConversationTitle(conversation)}
                  </h3>
                  {/* Removed blue hover dot next to title */}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full transition-opacity ${
                    isSelected
                      ? 'bg-primary/15 text-primary opacity-100'
                      : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100'
                  }`}>
                    {conversation.message_count}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditing(true)
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-2" />
                        Hernoemen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete()
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center mt-1">
              <Clock className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">
                {conversation.last_message_at 
                  ? format(new Date(conversation.last_message_at), 'MMM d, HH:mm')
                  : format(new Date(conversation.created_at), 'MMM d, HH:mm')
                }
              </span>
            </div>
          )}
        </>
      ) : (
        // When collapsed, hide individual chat dots entirely
        <div className="h-2" />
      )}
    </div>
  )
}
