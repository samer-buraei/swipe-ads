'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { motion } from 'framer-motion';

const items = [
  { href: ROUTES.home, label: 'Home', icon: Home },
  { href: '/search', label: 'Pretraga', icon: Search },
  { href: ROUTES.favorites, label: 'Sačuvano', icon: Heart },
  { href: ROUTES.messages, label: 'Inbox', icon: Mail },
  { href: ROUTES.profile, label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="mx-auto grid max-w-md grid-cols-5 pb-5 pt-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 relative py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-2 h-0.5 w-8 rounded-full bg-[#1B3D7E]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <item.icon
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive ? 'text-[#1B3D7E]' : 'text-gray-400'
                )}
              />

              <span className={cn(
                'text-[10px] transition-all duration-200',
                isActive ? 'font-semibold text-[#1B3D7E]' : 'font-medium text-gray-400'
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
