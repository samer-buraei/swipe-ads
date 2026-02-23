// components/messages/useRealtimeMessages.ts
// Real-time message subscription hook using Supabase Realtime
'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeMessage {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
}

interface UseRealtimeMessagesOptions {
    conversationId: string
    onNewMessage?: (message: RealtimeMessage) => void
    enabled?: boolean
}

export function useRealtimeMessages({
    conversationId,
    onNewMessage,
    enabled = true,
}: UseRealtimeMessagesOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null)

    const cleanup = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.unsubscribe()
            channelRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!enabled || !conversationId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMessage = payload.new as RealtimeMessage
                    onNewMessage?.(newMessage)
                }
            )
            .subscribe()

        channelRef.current = channel

        return cleanup
    }, [conversationId, onNewMessage, enabled, cleanup])

    return { cleanup }
}
