'use client';

import { ListingCard } from '@/components/listings/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/trpc';
import type { ListListingsInput } from '@/contracts/validators';

interface ListingGridProps {
  filters?: Partial<ListListingsInput>;
}

export function ListingGrid({ filters }: ListingGridProps) {
  const { data, isLoading, error } = api.listing.list.useQuery({
    limit: 12,
    ...filters,
  });

  if (isLoading) return <ListingGridSkeleton />;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Došlo je do greške pri učitavanju oglasa.
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-10 text-center text-black/60">
        Nema oglasa za izabrane filtere.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.items.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`sk-${index}`}
          className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 p-4"
        >
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
