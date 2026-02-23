'use client'
import { api } from '@/lib/trpc'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import type { ConversationPreview } from '@/contracts/api'

interface ConversationListProps {
    onSelect: (conversationId: string) => void
    selectedId?: string
}

export function ConversationList({ onSelect, selectedId }: ConversationListProps) {
    const { data, isLoading } = api.message.listConversations.useQuery({ limit: 20 })

    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-14 h-14 rounded-xl bg-secondary shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-secondary rounded w-3/4" />
                            <div className="h-3 bg-secondary rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const conversations = data?.items ?? []

    if (!conversations.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-semibold text-foreground mb-1">Nema poruka</h3>
                <p className="text-sm text-muted-foreground">
                    Kontaktiraj prodavca da počneš razgovor
                </p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {conversations.map((conv) => {
                const isSelected = conv.id === selectedId
                const hasUnread = (conv.unreadCount ?? 0) > 0

                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`w-full flex gap-3 p-4 text-left hover:bg-secondary/50 transition-colors ${isSelected ? 'bg-primary/5' : ''
                            }`}
                    >
                        {/* Listing thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                            {conv.listing.heroImage ? (
                                <img
                                    src={conv.listing.heroImage}
                                    alt={conv.listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                                    {conv.otherUser.name?.[0] ?? 'K'}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                    {conv.otherUser.name ?? 'Korisnik'}
                                </p>
                                {conv.lastMessage && (
                                    <span className="text-xs text-muted-foreground/60 shrink-0">
                                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                                            addSuffix: false,
                                            locale: sr,
                                        })}
                                    </span>
                                )}
                            </div>

                            <p className={`text-xs mt-0.5 truncate ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {conv.lastMessage?.content ?? 'Početak razgovora'}
                            </p>

                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground mt-1 inline-block truncate max-w-full">
                                {conv.listing.title}
                            </span>
                        </div>

                        {/* Unread badge */}
                        {hasUnread && (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center self-center">
                                <span className="text-primary-foreground text-xs font-bold">{conv.unreadCount}</span>
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
