'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '@/lib/trpc'
import { useRealtimeMessages } from './useRealtimeMessages'
import { Send, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import type { MessageItem } from '@/contracts/api'

interface ConversationViewProps {
    conversationId: string
    currentUserId: string
    onBack?: () => void
}

export function ConversationView({ conversationId, currentUserId, onBack }: ConversationViewProps) {
    const [input, setInput] = useState('')
    const [realtimeMessages, setRealtimeMessages] = useState<MessageItem[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const utils = api.useUtils()
    const { data, isLoading } = api.message.getConversation.useQuery(
        { conversationId }
    )

    const markReadMutation = api.message.markRead.useMutation()

    // Handle new realtime messages
    const handleNewMessage = useCallback((msg: any) => {
        setRealtimeMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, {
                id: msg.id,
                content: msg.content,
                isFromMe: msg.sender_id === currentUserId,
                isRead: msg.is_read,
                createdAt: new Date(msg.created_at),
            }]
        })
    }, [currentUserId])

    // Subscribe to realtime messages
    useRealtimeMessages({
        conversationId,
        onNewMessage: handleNewMessage,
        enabled: !!conversationId,
    })

    const sendMessage = api.message.send.useMutation()

    // Combine initial + realtime messages, deduplicating
    const allMessages = (() => {
        const initial = data?.messages ?? []
        const initialIds = new Set(initial.map(m => m.id))
        const newOnes = realtimeMessages.filter(m => !initialIds.has(m.id))
        return [...initial, ...newOnes]
    })()

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [allMessages.length])

    // Mark messages as read on view
    useEffect(() => {
        if (allMessages.length > 0) {
            const hasUnread = allMessages.some(m => !m.isFromMe && !m.isRead)
            if (hasUnread) {
                markReadMutation.mutate({ conversationId })
                utils.message.listConversations.invalidate()
            }
        }
    }, [allMessages, conversationId])

    // Reset realtime messages when conversation changes
    useEffect(() => {
        setRealtimeMessages([])
    }, [conversationId])

    const handleSend = () => {
        const trimmed = input.trim()
        if (!trimmed || sendMessage.isLoading) return

        // Optimistic local message
        const optimistic: MessageItem = {
            id: `optimistic-${Date.now()}`,
            content: trimmed,
            isFromMe: true,
            isRead: false,
            createdAt: new Date(),
        }
        setRealtimeMessages(prev => [...prev, optimistic])
        setInput('')

        sendMessage.mutate({
            listingId: data?.listing.id ?? '',
            receiverId: data?.otherUser.id ?? '',
            content: trimmed,
            conversationId,  // pass known ID so server skips the RLS-blocked lookup
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                {onBack && (
                    <button onClick={onBack} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                        {data?.otherUser.name ?? 'Korisnik'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {data?.listing.title}
                    </p>
                </div>
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {allMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.isFromMe
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-secondary text-foreground rounded-bl-md'
                                }`}
                        >
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-0.5 ${msg.isFromMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(msg.createdAt), {
                                    addSuffix: true,
                                    locale: sr,
                                })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-border bg-card flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Unesite poruku..."
                    className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessage.isLoading}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    <Send className="w-4 h-4 text-primary-foreground" />
                </button>
            </div>
        </div>
    )
}
