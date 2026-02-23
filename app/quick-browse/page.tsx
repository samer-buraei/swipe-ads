'use client';

import { SwipeDeck, SwipeDeckSkeleton } from '@/components/listings/SwipeDeck';
import { api } from '@/lib/trpc';

export default function QuickBrowsePage() {
  const { data, isLoading, refetch } = api.swipe.getDeck.useQuery({ count: 12 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Quick Browse</h1>
        <p className="text-black/60">
          Prevucite desno da sačuvate, levo da preskočite.
        </p>
      </div>

      <div className="flex justify-center">
        {isLoading || !data ? (
          <SwipeDeckSkeleton />
        ) : (
          <SwipeDeck
            initialCards={data.cards}
            onEmpty={() => {
              refetch().catch(() => {});
            }}
          />
        )}
      </div>
    </div>
  );
}
