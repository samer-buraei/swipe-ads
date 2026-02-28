// server/api/routers/message.ts
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
  sendMessageSchema,
  listConversationsSchema,
  getConversationSchema,
  markMessagesReadSchema,
} from '@/contracts/validators'
import type {
  ConversationsResponse,
  ConversationDetail,
  SendMessageResponse,
  MutationResponse,
} from '@/contracts/api'
import { ERRORS, SUCCESS, LIMITS } from '@/lib/constants'

export const messageRouter = createTRPCRouter({
  listConversations: protectedProcedure
    .input(listConversationsSchema)
    .query(async ({ ctx }): Promise<ConversationsResponse> => {
      // Get conversations where current user is a participant
      const { data: participations } = await ctx.supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', ctx.user.id)

      const conversationIds = participations?.map((p) => p.conversation_id) ?? []
      if (conversationIds.length === 0) {
        return { items: [], nextCursor: null, hasMore: false }
      }

      const { data: conversations, error } = await ctx.supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          listing_id,
          listings (
            id, slug, title, status,
            listing_images(thumb_url)
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (error) throw new Error(error.message)

      const items = await Promise.all(
        (conversations ?? []).map(async (c: any) => {
          // Get other participants
          const { data: otherParts } = await ctx.supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', c.id)
            .neq('user_id', ctx.user.id)

          const otherUserId = otherParts?.[0]?.user_id
          let otherUser = { id: 'unknown', name: null as string | null, avatarUrl: null as string | null }
          if (otherUserId) {
            const { data: u } = await ctx.supabase
              .from('users')
              .select('id, name, image')
              .eq('id', otherUserId)
              .single()
            if (u) {
              otherUser = { id: u.id, name: u.name, avatarUrl: u.image }
            }
          }

          // Get last message
          const { data: lastMsgs } = await ctx.supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const lastMessage = lastMsgs?.[0]

          // Get my unread_count
          const { data: myPart } = await ctx.supabase
            .from('conversation_participants')
            .select('unread_count')
            .eq('conversation_id', c.id)
            .eq('user_id', ctx.user.id)
            .single()

          // Fallback Count
          const { count: unreadCountFallback } = await ctx.supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', ctx.user.id)
            .eq('is_read', false)

          return {
            id: c.id,
            listing: {
              id: c.listings?.id ?? '',
              slug: c.listings?.slug ?? c.listings?.id ?? '',
              title: c.listings?.title ?? '',
              heroImage: c.listings?.listing_images?.[0]?.thumb_url ?? null,
              status: c.listings?.status ?? 'ACTIVE',
            },
            otherUser,
            lastMessage: lastMessage
              ? {
                content: lastMessage.content,
                createdAt: new Date(lastMessage.created_at),
                isFromMe: lastMessage.sender_id === ctx.user.id,
              }
              : null,
            unreadCount: myPart?.unread_count ?? unreadCountFallback ?? 0,
            updatedAt: new Date(c.updated_at),
          }
        })
      )

      return { items, nextCursor: null, hasMore: false }
    }),

  getConversation: protectedProcedure
    .input(getConversationSchema)
    .query(async ({ ctx, input }): Promise<ConversationDetail> => {
      // Verify current user is a participant
      const { data: participation } = await ctx.supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.user.id)
        .maybeSingle()

      if (!participation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: ERRORS.GENERIC_ERROR })
      }

      // Get conversation with listing
      const { data: conversation } = await ctx.supabase
        .from('conversations')
        .select(`
          id,
          listings (
            id, slug, title, price, currency, status, user_id,
            listing_images(thumb_url)
          )
        `)
        .eq('id', input.conversationId)
        .single()

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: ERRORS.GENERIC_ERROR })
      }

      // Get other user
      const { data: otherParts } = await ctx.supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', input.conversationId)
        .neq('user_id', ctx.user.id)

      let otherUser = {
        id: 'unknown',
        name: null as string | null,
        avatarUrl: null as string | null,
        isVerified: false,
      }
      if (otherParts?.[0]?.user_id) {
        const { data: u } = await ctx.supabase
          .from('users')
          .select('id, name, image, is_verified')
          .eq('id', otherParts[0].user_id)
          .single()
        if (u) {
          otherUser = { id: u.id, name: u.name, avatarUrl: u.image, isVerified: u.is_verified }
        }
      }

      // Get all messages
      const { data: messages } = await ctx.supabase
        .from('messages')
        .select('id, content, sender_id, is_read, created_at')
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true })

      const listing = (conversation as any).listings

      return {
        id: conversation.id,
        listing: {
          id: listing?.id ?? '',
          slug: listing?.slug ?? listing?.id ?? '',
          title: listing?.title ?? '',
          price: Number(listing?.price ?? 0),
          currency: listing?.currency ?? 'RSD',
          heroImage: listing?.listing_images?.[0]?.thumb_url ?? null,
          status: listing?.status ?? 'ACTIVE',
          sellerId: listing?.user_id ?? '',
          images: [],
        },
        otherUser,
        messages: (messages ?? []).map((m) => ({
          id: m.id,
          content: m.content,
          isFromMe: m.sender_id === ctx.user.id,
          isRead: m.is_read,
          createdAt: new Date(m.created_at),
        })),
      }
    }),

  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }): Promise<SendMessageResponse> => {
      if (ctx.user.id === input.receiverId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ne možete slati poruke sami sebi.',
        })
      }

      // Rate limiting check
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: recentMessages } = await ctx.supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', ctx.user.id)
        .gte('created_at', oneHourAgo);

      if (recentMessages !== null && recentMessages >= LIMITS.MAX_MESSAGES_PER_HOUR) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: ERRORS.TOO_MANY_MESSAGES,
        })
      }

      // Find existing conversation for this listing between these two users
      const { data: myConvs } = await ctx.supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', ctx.user.id)

      let conversationId: string | null = null
      const myConvIds = myConvs?.map((c) => c.conversation_id) ?? []

      if (myConvIds.length > 0) {
        // Check if receiver is also in any of these conversations for this listing
        const { data: theirConvs } = await ctx.supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', input.receiverId)
          .in('conversation_id', myConvIds)

        for (const tc of theirConvs ?? []) {
          const { data: conv } = await ctx.supabase
            .from('conversations')
            .select('id, listing_id')
            .eq('id', tc.conversation_id)
            .eq('listing_id', input.listingId)
            .maybeSingle()
          if (conv) {
            conversationId = conv.id
            break
          }
        }
      }

      // Create conversation if not found
      if (!conversationId) {
        const { data: newConv, error } = await ctx.supabase
          .from('conversations')
          .insert({ listing_id: input.listingId })
          .select()
          .single()

        if (error || !newConv) throw new Error(error?.message ?? 'Failed to create conversation')
        conversationId = newConv.id

        // Add both participants
        await ctx.supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: ctx.user.id },
            { conversation_id: conversationId, user_id: input.receiverId },
          ])
      }

      // Create the message
      const { data: message, error } = await ctx.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: ctx.user.id,
          content: input.content,
        })
        .select()
        .single()

      if (error || !message) throw new Error(error?.message ?? 'Failed to send message')

      // Update conversation timestamp
      await ctx.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      // Increment unread count for receiver
      const { data: receiverPart } = await ctx.supabase
        .from('conversation_participants')
        .select('unread_count')
        .eq('conversation_id', conversationId)
        .eq('user_id', input.receiverId)
        .single()

      if (receiverPart) {
        await ctx.supabase
          .from('conversation_participants')
          .update({ unread_count: (receiverPart.unread_count || 0) + 1 })
          .eq('conversation_id', conversationId)
          .eq('user_id', input.receiverId)
      }

      return { messageId: message.id, conversationId: conversationId! }
    }),

  markRead: protectedProcedure
    .input(markMessagesReadSchema)
    .mutation(async ({ ctx, input }): Promise<MutationResponse> => {
      await ctx.supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', input.conversationId)
        .neq('sender_id', ctx.user.id)
        .eq('is_read', false)

      await ctx.supabase
        .from('conversation_participants')
        .update({ unread_count: 0 })
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.user.id)

      return { success: true, message: SUCCESS.MESSAGE_SENT }
    }),
})
