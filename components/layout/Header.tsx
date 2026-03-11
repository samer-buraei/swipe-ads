'use client';

import Link from 'next/link';
import { Search, PlusCircle, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1B3D7E]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={ROUTES.home} className="flex items-center">
          <span className="text-xl font-bold text-white tracking-tight">
            Swipe<span className="font-light">Market</span>
          </span>
        </Link>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pretraži..."
                className="bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-1.5 text-sm outline-none focus:bg-white/30 w-44"
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
              />
              <button type="button" onClick={() => setShowSearch(false)} className="text-white/70 text-sm">
                Otkaži
              </button>
            </form>
          ) : (
            <>
              <button onClick={() => setShowSearch(true)} aria-label="Pretraži">
                <Search className="h-5 w-5 text-white" />
              </button>
              <Link href={ROUTES.newListing} aria-label="Postavi oglas">
                <PlusCircle className="h-5 w-5 text-white" />
              </Link>
              <Link href="/search" aria-label="Filteri">
                <SlidersHorizontal className="h-5 w-5 text-white" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
