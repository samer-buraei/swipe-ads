'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Car, Home, Package, Smartphone } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { ROUTES } from '@/lib/constants';
import { api } from '@/lib/trpc';
import { useExchangeRate } from '@/lib/hooks/useExchangeRate';

const CATEGORY_CARDS = [
  {
    id: 'vozila',
    label: 'Automobili',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    href: '/search?category=vozila',
    tall: true,
  },
  {
    id: 'nekretnine',
    label: 'Stanovi',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    href: '/search?category=nekretnine',
    tall: true,
  },
  {
    id: 'elektronika',
    label: 'Elektronika',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    href: '/search?category=elektronika',
    tall: false,
  },
  {
    id: 'ostalo',
    label: 'Ostalo',
    icon: Package,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    href: '/search',
    tall: false,
  },
];

function PopularItem({ listing, eurRate }: { listing: (typeof MOCK_LISTINGS)[0]; eurRate?: number }) {
  const priceEur = listing.currency === 'EUR'
    ? listing.price
    : eurRate ? Math.round(listing.price / eurRate) : null;

  return (
    <Link href={ROUTES.listing(listing.slug)} className="flex-shrink-0 w-20">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
        {listing.heroImage && (
          <Image
            src={listing.heroImage.thumbUrl}
            alt={listing.title}
            fill
            className="object-cover"
          />
        )}
        {priceEur && (
          <span className="absolute top-1 right-1 bg-[#1B3D7E] text-white text-[9px] px-1.5 py-0.5 rounded font-bold leading-tight">
            €{priceEur.toLocaleString('de-DE')}
          </span>
        )}
      </div>
      <p className="text-[11px] text-center mt-1 text-gray-700 truncate leading-tight px-0.5">
        {listing.title.split(' ').slice(0, 2).join(' ')}
      </p>
    </Link>
  );
}

export default function HomePage() {
  const { data: listingsData } = api.listing.list.useQuery({ limit: 8 }, { retry: false });
  const { data: exchange } = useExchangeRate();

  const popularListings = listingsData?.items?.length
    ? listingsData.items.slice(0, 8)
    : MOCK_LISTINGS.slice(0, 8);

  return (
    <div className="pb-2">
      {/* Category Cards */}
      <section className="px-4 pt-4 space-y-3">
        {/* Two large tall cards */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_CARDS.filter(c => c.tall).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={cat.href}>
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <Icon className="h-6 w-6 mb-1 drop-shadow" />
                    <p className="text-base font-bold leading-tight drop-shadow">{cat.label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Two smaller half-height cards */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_CARDS.filter(c => !c.tall).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={cat.href}>
                <div className="relative h-28 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                    <Icon className="h-5 w-5 mb-0.5 drop-shadow" />
                    <p className="text-sm font-bold leading-tight drop-shadow">{cat.label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popularno section */}
      <section className="mt-5 px-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Popularno</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {popularListings.map((listing) => (
            <PopularItem key={listing.id} listing={listing} eurRate={exchange?.rate} />
          ))}
        </div>
      </section>
    </div>
  );
}
