'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Star } from 'lucide-react';
import type { ListingCard as ListingCardType } from '@/contracts/api';
import { formatPrice, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ListingCardProps {
  listing: ListingCardType;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const [localFavorite, setLocalFavorite] = useState(listing.isFavorited ?? false);
  const utils = api.useUtils();
  const toggleFavorite = api.favorite.toggle.useMutation({
    onSuccess: (data) => {
      setLocalFavorite(data.isFavorited);
      utils.favorite.list.invalidate().catch(() => { });
    },
  });

  const isFavorited = localFavorite;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[2rem] bg-card text-card-foreground transition-all duration-500 hover:-translate-y-1',
        listing.isPremium
          ? 'ring-2 ring-amber-400 shadow-[0_8px_30px_rgba(251,191,36,0.2)] hover:shadow-[0_20px_40px_rgba(251,191,36,0.3)]'
          : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]',
        className
      )}
    >
      {listing.isPremium && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          <Star className="w-3 h-3 fill-amber-900" /> PREMIUM
        </div>
      )}
      <Link href={ROUTES.listing(listing.slug)} className="block relative aspect-[4/3] overflow-hidden">
        {listing.heroImage ? (
          <Image
            src={listing.heroImage.mediumUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-sm text-muted-foreground">
            Nema slike
          </div>
        )}

        {/* Gradient Overlay for Text Readability if we put text on image, 
            but here we keep text below for cleanliness. 
            However, we can add a subtle inner shadow. */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem] pointer-events-none" />
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Price - The most important info */}
            <div className="text-xl font-bold tracking-tight text-primary">
              {formatPrice(listing.price, listing.currency)}
            </div>

            <Link href={ROUTES.listing(listing.slug)}>
              <h3 className="line-clamp-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
            </Link>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{listing.city}</span>
              </div>

              {/* Dynamic Attributes */}
              {listing.attributes && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  {(listing.categoryId === 'vehicles' && listing.attributes.brand) ? (
                    <span>{listing.attributes.brand} {listing.attributes.model}</span>
                  ) : (listing.categoryId === 'home' && listing.attributes.type) ? (
                    <span>{listing.attributes.type} {listing.attributes.sqm}m²</span>
                  ) : (
                    <span>{listing.attributes.condition || 'Polovno'}</span>
                  )}
                </>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0 rounded-full bg-secondary/50 hover:bg-white hover:shadow-md transition-all',
              isFavorited && 'text-red-500 bg-red-50 hover:bg-red-100'
            )}
            onClick={(event) => {
              event.preventDefault();
              toggleFavorite.mutate({ listingId: listing.id });
            }}
            aria-label="Sačuvaj oglas"
          >
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
          </Button>
        </div>
      </div>
    </div>
  );
}
