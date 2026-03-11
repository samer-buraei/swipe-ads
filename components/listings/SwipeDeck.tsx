// components/listings/SwipeDeck.tsx
// Tinder-style swipe deck for browsing listings
// Uses Framer Motion for smooth animations

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, X, RotateCcw, Phone, EyeOff, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, UI, ROUTES } from '@/lib/constants';
import { api } from '@/lib/trpc';
import type { ListingCard } from '@/contracts/api';
import { Button } from '@/components/ui/button';
import { useExchangeRate } from '@/lib/hooks/useExchangeRate';
import { useRouter } from 'next/navigation';

interface SwipeDeckProps {
  initialCards: ListingCard[];
  onSwipe?: (listing: ListingCard, direction: 'LEFT' | 'RIGHT') => void;
  onEmpty?: () => void;
  className?: string;
}

export function SwipeDeck({
  initialCards,
  onSwipe,
  onEmpty,
  className,
}: SwipeDeckProps) {
  const [cards, setCards] = useState<ListingCard[]>(initialCards);
  const [lastSwiped, setLastSwiped] = useState<ListingCard | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const swipeStartTime = useRef<number>(Date.now());

  const recordSwipe = api.swipe.record.useMutation();

  const handleSwipe = useCallback(
    async (direction: 'LEFT' | 'RIGHT') => {
      if (cards.length === 0 || isAnimating) return;

      setIsAnimating(true);
      const currentCard = cards[0];
      const timeSpent = Date.now() - swipeStartTime.current;

      recordSwipe.mutate({
        listingId: currentCard.id,
        direction,
        timeSpentMs: timeSpent,
      });

      onSwipe?.(currentCard, direction);
      setCards((prev) => prev.slice(1));
      setLastSwiped(currentCard);

      swipeStartTime.current = Date.now();

      setTimeout(() => setIsAnimating(false), 300);

      if (cards.length === 1) {
        onEmpty?.();
      }
    },
    [cards, isAnimating, recordSwipe, onSwipe, onEmpty]
  );

  const handleUndo = useCallback(() => {
    if (!lastSwiped) return;
    setCards((prev) => [lastSwiped, ...prev]);
    setLastSwiped(null);
  }, [lastSwiped]);

  if (cards.length === 0) {
    return (
      <div className={cn('flex h-[60vh] flex-col items-center justify-center p-8', className)}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
            <div className="absolute inset-0 animate-ping rounded-full bg-secondary/50" />
            <span className="text-4xl">🎉</span>
          </div>
          <h3 className="mb-2 font-serif text-2xl font-bold">Nema više oglasa</h3>
          <p className="mb-8 max-w-xs text-muted-foreground">
            Pregledali ste sve oglase u vašoj okolini. Vratite se kasnije!
          </p>
          <div className="flex gap-3 justify-center">
            {lastSwiped && (
              <Button variant="outline" onClick={handleUndo} className="gap-2 rounded-full">
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>
            )}
            <Button onClick={() => window.location.reload()} className="rounded-full px-8">
              Osveži
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Card Stack Container */}
      <div className="relative w-full" style={{ height: 'calc(100svh - 14rem)' }}>
        <AnimatePresence mode='popLayout'>
          {cards.slice(0, 3).map((card, i) => (
            <SwipeCard
              key={card.id}
              card={card}
              index={i}
              isTop={i === 0}
              onSwipe={handleSwipe}
              disabled={isAnimating}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual swipe card component
interface SwipeCardProps {
  card: ListingCard;
  index: number;
  isTop: boolean;
  onSwipe: (direction: 'LEFT' | 'RIGHT') => void;
  disabled?: boolean;
}

function SwipeCard({ card, index, isTop, onSwipe, disabled }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const router = useRouter();
  const { data: exchange } = useExchangeRate();
  const toggleFavorite = api.favorite.toggle.useMutation();

  // Physics setup
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // Overlay Opacities
  const likeOpacity = useTransform(x, [20, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -150], [0, 1]);

  // Stack Scale/Y setup
  const scale = 1 - index * 0.04;
  const translateY = index * 12;
  const zIndex = 50 - index;

  const eurPrice = exchange?.rate
    ? card.currency === 'EUR'
      ? card.price
      : Math.round(card.price / exchange.rate)
    : null;

  const conditionLabel = card.condition === 'NEW' ? 'Novo'
    : card.condition === 'LIKE_NEW' ? 'Kao novo'
    : card.condition === 'GOOD' ? 'Odlično stanje'
    : 'Korišćeno';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;

    const { offset, velocity } = info;
    const swipeThreshold = UI.SWIPE_THRESHOLD || 100;

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      const direction = offset.x > 0 ? 'RIGHT' : 'LEFT';
      const targetX = direction === 'RIGHT' ? 800 : -800;

      animate(x, targetX, {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        onComplete: () => onSwipe(direction),
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      className={cn(
        'absolute inset-0 origin-bottom touch-none',
        !isTop && 'pointer-events-none'
      )}
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : translateY,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex,
      }}
      drag={isTop && !disabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-lg flex flex-col">
        {/* Image area — takes ~60% of card */}
        <div className="relative flex-1 bg-gray-100 cursor-grab active:cursor-grabbing">
          {card.heroImage ? (
            <Image
              src={card.heroImage.mediumUrl}
              alt={card.title}
              fill
              className="object-cover"
              priority={isTop}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gray-100">
              <span className="text-4xl">📷</span>
              <span className="text-sm text-gray-400">Nema slike</span>
            </div>
          )}

          {/* Like/Nope stamps */}
          {isTop && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute left-4 top-6 rounded-xl border-4 border-green-500 px-3 py-1.5 rotate-[-15deg] z-10 bg-green-500/10 backdrop-blur-sm"
              >
                <span className="font-bold text-xl text-green-500 tracking-widest">LIKE</span>
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute right-4 top-6 rounded-xl border-4 border-red-500 px-3 py-1.5 rotate-[15deg] z-10 bg-red-500/10 backdrop-blur-sm"
              >
                <span className="font-bold text-xl text-red-500 tracking-widest">NOPE</span>
              </motion.div>
            </>
          )}

          {/* Top badges */}
          {card.isPremium && (
            <div className="absolute top-3 left-3 z-10 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-900" /> PREMIUM
            </div>
          )}

          {/* Photo counter */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <span>1/1</span>
            <ChevronRight className="h-3 w-3" />
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            <div className="w-4 h-1 rounded-full bg-white" />
          </div>
        </div>

        {/* Bottom info panel — white */}
        <div className="bg-white px-4 pt-3 pb-4 flex-shrink-0">
          <Link href={ROUTES.listing(card.slug)} className="block" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">
              {card.title}
            </h2>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {eurPrice !== null
                ? `€${eurPrice.toLocaleString('de-DE')}`
                : formatPrice(card.price, card.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {conditionLabel} • {card.city}
            </p>
          </Link>

          {/* Action buttons */}
          <div className="flex justify-center gap-4 mt-3">
            <button
              onClick={() => onSwipe('LEFT')}
              disabled={disabled}
              className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Preskoči"
            >
              <X className="h-5 w-5 text-gray-500" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { toggleFavorite.mutate({ listingId: card.id }); onSwipe('RIGHT'); }}
              disabled={disabled}
              className="w-[52px] h-[52px] rounded-full bg-gray-800 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Sačuvaj"
            >
              <Heart className="h-5 w-5 text-white fill-white" />
            </button>
            <button
              onClick={() => { if (card.seller?.id) router.push(ROUTES.listing(card.slug)); }}
              disabled={disabled}
              className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Pozovi"
            >
              <Phone className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => onSwipe('LEFT')}
              disabled={disabled}
              className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Sakrij"
            >
              <EyeOff className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeDeckSkeleton() {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gray-100 animate-pulse" style={{ height: 'calc(100svh - 14rem)' }}>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-white" />
    </div>
  );
}
