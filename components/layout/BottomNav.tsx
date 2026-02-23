'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, MessageCircle, PlusCircle, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { motion } from 'framer-motion';

const items = [
  { href: ROUTES.home, label: 'Početna', icon: Home },
  { href: ROUTES.quickBrowse, label: 'Swipe', icon: Sparkles },
  { href: ROUTES.newListing, label: 'Novo', icon: PlusCircle, isPrimary: true },
  { href: ROUTES.favorites, label: 'Omiljeni', icon: Heart },
  { href: ROUTES.messages, label: 'Poruke', icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass Background with Gradient Fade */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" />

      <div className="relative mx-auto grid max-w-md grid-cols-5 gap-1 px-2 pb-6 pt-3">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-1 transition-all duration-300 relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-3 h-1 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative">
                <item.icon
                  className={cn(
                    'transition-all duration-300',
                    isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2',
                    item.isPrimary && 'h-7 w-7 text-primary fill-primary/10'
                  )}
                  size={24}
                />
                {/* Notification Dot Example */}
                {item.label === 'Poruke' && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </div>

              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
