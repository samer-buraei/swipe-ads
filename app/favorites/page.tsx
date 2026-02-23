'use client';

import { ListingCard } from '@/components/listings/ListingCard';
import { api } from '@/lib/trpc';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function FavoritesPage() {
  const { data, isLoading } = api.favorite.list.useQuery({ limit: 20 });

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Sačuvano</h1>
          <p className="text-muted-foreground">Vaša kolekcija omiljenih oglasa.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] rounded-[2rem] bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-[2.5rem] bg-card p-12 text-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-black/5 min-h-[400px]"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
            <Heart className="h-10 w-10 fill-current" />
          </div>
          <h2 className="mb-3 font-serif text-2xl font-bold text-foreground">
            Još nema favorita
          </h2>
          <p className="mb-8 max-w-sm text-muted-foreground text-lg leading-relaxed">
            Istražite oglase i sačuvajte one koji vam se sviđaju. Pojaviće se ovde za lakši pristup.
          </p>
          <Link href={ROUTES.quickBrowse}>
            <Button size="lg" className="px-8 text-base">
              Započni pretragu
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <ListingCard key={item.id} listing={item.listing} />
          ))}
        </div>
      )}
    </div>
  );
}
