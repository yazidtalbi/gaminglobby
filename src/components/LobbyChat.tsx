'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LobbyMessage, Profile } from '@/types/database'
import { Send, Loader2 } from 'lucide-react'

interface LobbyMessageWithProfile extends LobbyMessage {
  profile?: Pick<Profile, 'username' | 'avatar_url'>
}

interface LobbyChatProps {
  lobbyId: string
  currentUserId: string
  disabled?: boolean
}

export function LobbyChat({ lobbyId, currentUserId, disabled = false }: LobbyChatProps) {
  const [messages, setMessages] = useState<LobbyMessageWithProfile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('lobby_messages')
        .select(`
          *,
          profile:profiles!lobby_messages_user_id_fkey(username, avatar_url)
        `)
        .eq('lobby_id', lobbyId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(data as unknown as LobbyMessageWithProfile[])
      }
      setIsLoading(false)
    }

    fetchMessages()
  }, [lobbyId, supabase])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`lobby-messages-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async (payload) => {
          // Check if message already exists to prevent duplicates
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === payload.new.id)
            if (exists) return prev
            return prev // Return unchanged, we'll add it after fetching profile
          })

          // Fetch profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          const newMsg: LobbyMessageWithProfile = {
            ...payload.new as LobbyMessage,
            profile: profile || undefined,
          }

          // Add message only if it doesn't already exist
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || disabled) return

    setIsSending(true)
    
    try {
      await supabase.from('lobby_messages').insert({
        lobby_id: lobbyId,
        user_id: currentUserId,
        content: newMessage.trim(),
      })

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.user_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
            disabled={disabled || isSending}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || isSending || !newMessage.trim()}
            className="px-4 py-2.5 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: LobbyMessageWithProfile
  isOwn: boolean
}) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Check if this is a system message
  const isSystemMessage = message.content.startsWith('[SYSTEM]')
  const systemContent = isSystemMessage ? message.content.replace('[SYSTEM] ', '') : message.content

  // System messages are displayed centered without avatar
  if (isSystemMessage) {
    return (
      <div className="flex items-center justify-center my-2">
        <div className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-full text-xs text-slate-400">
          {systemContent}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
        {message.profile?.avatar_url ? (
          <img
            src={message.profile.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-slate-400">
            {message.profile?.username || 'Unknown'}
          </span>
          <span className="text-xs text-slate-500">{time}</span>
        </div>
        <div
          className={`
            px-3 py-2 rounded-xl text-sm
            ${isOwn
              ? 'bg-app-green-600 text-white rounded-br-sm'
              : 'bg-slate-700 text-slate-200 rounded-bl-sm'
            }
          `}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

