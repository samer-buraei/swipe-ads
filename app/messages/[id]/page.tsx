'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { Send, Image as ImageIcon, ArrowLeft, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.message.getConversation.useQuery({
    conversationId: params.id,
  });

  const sendMutation = api.message.send.useMutation({
    onSuccess: () => {
      // Re-fetch the conversation so the new message appears immediately.
      // (Input is cleared at the call site, before the mutation.)
      utils.message.getConversation.invalidate({ conversationId: params.id }).catch(() => { });
      utils.message.listConversations.invalidate().catch(() => { });
    },
    onError: (err) => {
      alert(`Greška pri slanju poruke: ${err.message}`);
    },
  });

  const markReadMutation = api.message.markRead.useMutation();

  const [liveMessages, setLiveMessages] = useState<any[]>([]);

  // Initial Sync & Mark Read
  useEffect(() => {
    if (data?.messages) {
      setLiveMessages(data.messages);

      const hasUnread = data.messages.some(m => !m.isFromMe && !m.isRead);
      if (hasUnread) {
        markReadMutation.mutate({ conversationId: params.id });
        utils.message.listConversations.invalidate();
      }
    }
  }, [data?.messages]);

  // Realtime Subscription
  useEffect(() => {
    if (!data?.otherUser?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room_${params.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${params.id}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        const msg = {
          id: newMsg.id,
          content: newMsg.content,
          isFromMe: newMsg.sender_id !== data.otherUser.id,
          isRead: newMsg.is_read,
          createdAt: new Date(newMsg.created_at),
        };

        setLiveMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!msg.isFromMe) {
          markReadMutation.mutate({ conversationId: params.id });
          utils.message.listConversations.invalidate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.otherUser?.id, params.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveMessages]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="font-serif text-2xl font-bold">Razgovor nije pronađen</h2>
        <Button onClick={() => router.back()}>Vrati se nazad</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-4">
      {/* Header */}
      <div className="shrink-0 z-10 bg-background/80 backdrop-blur-md border-b border-black/5 sticky top-0 pb-4">
        <div className="flex items-center gap-3 px-1 mb-4">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold leading-none">{data.otherUser.name ?? 'Korisnik'}</h1>
            <span className="text-xs text-muted-foreground">{data.listing.title}</span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Product Snippet */}
        <div
          onClick={() => router.push(ROUTES.listing(data.listing.slug))}
          className="mx-1 flex items-center gap-3 rounded-2xl bg-secondary/50 p-2 pr-4 transition-colors hover:bg-secondary cursor-pointer"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
            {data.listing.images?.[0] ? (
              <Image src={data.listing.images[0].thumbUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] text-gray-400">Nema slike</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{data.listing.title}</div>
            <div className="text-sm text-primary font-bold">{data.listing.price} {data.listing.currency}</div>
          </div>
          <div className="text-xs font-semibold text-primary">Vidi oglas</div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 py-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {liveMessages.map((msg, i) => {
            const isMe = msg.isFromMe;
            const isSequenced = i > 0 && liveMessages[i - 1].isFromMe === isMe;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-5 py-3 text-[15px] leading-relaxed shadow-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-[1.5rem] rounded-br-[0.25rem]"
                      : "bg-white border border-black/5 text-foreground rounded-[1.5rem] rounded-bl-[0.25rem]",
                    isSequenced && (isMe ? "rounded-tr-[0.5rem]" : "rounded-tl-[0.5rem]")
                  )}
                >
                  {msg.content}
                  <div
                    className={cn(
                      "mt-1 text-[10px] font-medium opacity-60 text-right",
                      isMe ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {formatDate(new Date(msg.createdAt))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div className="h-4" /> {/* Bottom spacer */}
      </div>

      {/* Input Area */}
      <div className="shrink-0 pt-2 pb-6 bg-background">
        <div className="relative flex items-end gap-2 rounded-[2rem] border border-black/10 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground shrink-0 h-10 w-10">
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Napiši poruku..."
            className="min-h-[44px] max-h-32 w-full resize-none border-0 bg-transparent py-3 focus-visible:ring-0 px-0 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) {
                  sendMutation.mutate({
                    listingId: data.listing.id,
                    receiverId: data.otherUser.id,
                    content: message.trim(),
                    conversationId: params.id,
                  });
                  setMessage('');
                }
              }
            }}
          />

          <Button
            size="icon"
            className={cn(
              "rounded-full h-10 w-10 shrink-0 transition-all duration-200",
              message.trim() ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 pointer-events-none w-0 px-0"
            )}
            onClick={() => {
              if (!message.trim()) return;
              sendMutation.mutate({
                listingId: data.listing.id,
                receiverId: data.otherUser.id,
                content: message.trim(),
                conversationId: params.id,
              });
              setMessage('');
            }}
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
