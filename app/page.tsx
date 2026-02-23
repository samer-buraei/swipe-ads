'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/trpc';
import { CATEGORIES, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const { data: categories } = api.category.list.useQuery();

  const filterArgs = useMemo(() => {
    return {
      query: query.trim().length ? query.trim() : undefined,
      categoryId,
    };
  }, [query, categoryId]);

  const categoryList = categories?.length ? categories : CATEGORIES;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl border border-black/10 bg-white/70 p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full bg-black/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Novi MVP demo
          </div>
          <h1 className="text-3xl font-semibold text-black md:text-4xl">
            Brzo pronađi oglase u svom gradu – swipe ili klasično pretraživanje.
          </h1>
          <p className="text-base text-black/60">
            SwipeMarket kombinuje klasične oglase sa brzim swipe iskustvom. Filtriraj,
            sačuvaj i odmah se javi prodavcu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ROUTES.quickBrowse}>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Quick Browse
              </Button>
            </Link>
            <Link href={ROUTES.newListing}>
              <Button variant="outline">Postavi oglas</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-black to-black/80 p-6 text-white">
          <div className="text-sm uppercase tracking-wide text-white/60">
            Trendovi ove nedelje
          </div>
          <div className="mt-3 space-y-3 text-base">
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span>Elektronika</span>
              <span className="text-white/70">+18%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span>Sport i rekreacija</span>
              <span className="text-white/70">+12%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span>Usluge</span>
              <span className="text-white/70">+9%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pretraži oglase, brendove, modele..."
              className="pl-9"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('');
              setCategoryId(undefined);
            }}
          >
            Resetuj filtere
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryList.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setCategoryId((prev) => (prev === category.id ? undefined : category.id))
              }
              className={cn(
                'rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition',
                categoryId === category.id
                  ? 'bg-black text-white'
                  : 'bg-white/70 text-black/70 hover:bg-black/5'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Najnoviji oglasi</h2>
          <Link href={ROUTES.quickBrowse} className="text-sm font-semibold text-black/60">
            Swipe prikaz →
          </Link>
        </div>
        <ListingGrid filters={filterArgs} />
      </section>
    </div>
  );
}
