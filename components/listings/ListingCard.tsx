'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Star, X, EyeOff } from 'lucide-react';
import type { ListingCard as ListingCardType } from '@/contracts/api';
import { formatPrice, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { useExchangeRate } from '@/lib/hooks/useExchangeRate';

interface ListingCardProps {
  listing: ListingCardType;
  className?: string;
  variant?: 'grid' | 'list';
}

export function ListingCard({ listing, className, variant = 'grid' }: ListingCardProps) {
  const [localFavorite, setLocalFavorite] = useState(listing.isFavorited ?? false);
  const utils = api.useUtils();
  const { data: exchange } = useExchangeRate();
  const toggleFavorite = api.favorite.toggle.useMutation({
    onSuccess: (data) => {
      setLocalFavorite(data.isFavorited);
      utils.favorite.list.invalidate().catch(() => { });
    },
  });

  const isFavorited = localFavorite;

  const eurPrice = exchange?.rate
    ? listing.currency === 'EUR'
      ? listing.price
      : Math.round(listing.price / exchange.rate)
    : null;

  const getMetaLine = () => {
    if (!listing.attributes) return listing.city;
    if (listing.categoryId === 'vozila' || listing.categoryId === 'vehicles') {
      const parts = [
        listing.attributes.year,
        listing.attributes.mileage ? `${listing.attributes.mileage} km` : null,
        listing.city,
      ].filter(Boolean);
      return parts.join(' | ');
    }
    if (listing.categoryId === 'nekretnine') {
      const parts = [
        listing.attributes.sqm ? `${listing.attributes.sqm}m²` : null,
        listing.city,
      ].filter(Boolean);
      return parts.join(' | ');
    }
    return listing.city;
  };

  if (variant === 'list') {
    return (
      <div className={cn('flex bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100', className)}>
        {/* Image */}
        <Link href={ROUTES.listing(listing.slug)} className="relative w-28 h-28 flex-shrink-0 bg-gray-100">
          {listing.heroImage ? (
            <Image
              src={listing.heroImage.thumbUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              Nema slike
            </div>
          )}
          {listing.isPremium && (
            <div className="absolute top-1 left-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-amber-900" /> PREMIUM
            </div>
          )}
          {/* Action icons overlaid at bottom */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-around px-1">
            <button
              className="bg-white/90 rounded-full p-1 shadow-sm"
              onClick={(e) => { e.preventDefault(); }}
              aria-label="Preskoči"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
            <button
              className={cn('bg-white/90 rounded-full p-1 shadow-sm', isFavorited && 'bg-red-50')}
              onClick={(e) => { e.preventDefault(); toggleFavorite.mutate({ listingId: listing.id }); }}
              aria-label="Sačuvaj"
            >
              <Heart className={cn('h-3 w-3', isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-500')} />
            </button>
            <button
              className="bg-white/90 rounded-full p-1 shadow-sm"
              onClick={(e) => { e.preventDefault(); }}
              aria-label="Sakrij"
            >
              <EyeOff className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        </Link>

        {/* Details */}
        <Link href={ROUTES.listing(listing.slug)} className="flex-1 p-3 min-w-0">
          <p className="font-semibold text-gray-900 text-sm line-clamp-1 leading-tight">
            {listing.title}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">
            {eurPrice !== null ? `€${eurPrice.toLocaleString('de-DE')}` : formatPrice(listing.price, listing.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-tight truncate">
            {getMetaLine()}
          </p>
        </Link>
      </div>
    );
  }

  // Grid variant (default)
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
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem] pointer-events-none" />
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-col">
              <div className="text-xl font-bold tracking-tight text-primary flex items-center flex-wrap gap-2">
                <span>{formatPrice(listing.price, listing.currency)}</span>
                {exchange?.rate && (
                  <span className="text-sm font-medium text-muted-foreground/70 tracking-normal">
                    (~{formatPrice(
                      listing.currency === 'RSD'
                        ? Math.round(listing.price / exchange.rate)
                        : Math.round(listing.price * exchange.rate),
                      listing.currency === 'RSD' ? 'EUR' : 'RSD'
                    )})
                  </span>
                )}
              </div>
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

              {listing.attributes && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  {(listing.categoryId === 'vozila' && listing.attributes.brand) ? (
                    <span>{listing.attributes.brand} {listing.attributes.model}</span>
                  ) : (listing.categoryId === 'nekretnine' && listing.attributes.propertyType) ? (
                    <span>{listing.attributes.propertyType} {listing.attributes.sqm}m²</span>
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
