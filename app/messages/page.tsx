'use client'
import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/messages/ConversationList'
import { ConversationView } from '@/components/messages/ConversationView'
import { createClient } from '@/lib/supabase/client'

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string>()
  const [currentUserId, setCurrentUserId] = useState<string>()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel: conversation list */}
      <div className={`w-full md:w-80 md:border-r border-border flex-shrink-0 ${selectedConversationId ? 'hidden md:flex flex-col' : 'flex flex-col'
        }`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">Poruke</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            onSelect={setSelectedConversationId}
            selectedId={selectedConversationId}
          />
        </div>
      </div>

      {/* Right panel: conversation view */}
      <div className={`flex-1 ${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-col`}>
        {selectedConversationId && currentUserId ? (
          <ConversationView
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
            onBack={() => setSelectedConversationId(undefined)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-5xl mb-4">👈</div>
            <p className="text-muted-foreground text-sm">
              Odaberi razgovor s leve strane
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
