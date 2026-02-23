'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Sparkles, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { SearchBar } from '@/components/search/SearchBar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm supports-[backdrop-filter]:bg-white/60" />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={ROUTES.home} className="group flex items-center gap-2 shrink-0">
          {/* Logo Mark */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <span className="font-serif text-2xl font-bold leading-none">S</span>
          </div>

          {/* Logo Type */}
          <div className="hidden sm:block">
            <div className="font-serif text-xl font-bold tracking-tight text-foreground">
              Swipe<span className="text-primary">Market</span>
            </div>
          </div>
        </Link>

        {/* Search bar — desktop */}
        <div className="hidden md:block flex-1 max-w-md">
          <SearchBar placeholder="Pretraži oglase..." />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex ml-auto">
          {[
            { href: ROUTES.quickBrowse, label: 'Swipe', icon: Sparkles },
            { href: ROUTES.favorites, label: 'Omiljeni', icon: Heart },
            { href: ROUTES.messages, label: 'Poruke', icon: MessageCircle },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="ml-2 pl-2 border-l border-border/50">
            <Link
              href={ROUTES.newListing}
              className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              Postavi oglas
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
