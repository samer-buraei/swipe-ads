// components/listings/SwipeDeck.tsx
// Tinder-style swipe deck for browsing listings
// Uses Framer Motion for smooth animations

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, X, RotateCcw, MapPin, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, UI } from '@/lib/constants';
import { api } from '@/lib/trpc';
import type { ListingCard } from '@/contracts/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

      // Optimistic state update speed
      recordSwipe.mutate({
        listingId: currentCard.id,
        direction,
        timeSpentMs: timeSpent,
      });

      onSwipe?.(currentCard, direction);
      setCards((prev) => prev.slice(1));
      setLastSwiped(currentCard);

      swipeStartTime.current = Date.now();

      // Short delay to allow animation to clear before enabling next interaction
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

  // Use a ref to access the card's animation controls externally (simplified here via props)

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
      <div className="relative h-[65vh] max-h-[600px] w-full max-w-sm shrink-0">
        <AnimatePresence mode='popLayout'>
          {cards.slice(0, 3).reverse().map((card, index) => {
            // We reverse logic: cards[0] is top, need to be last in DOM or use z-index.
            // Mapping slice(0,3).reverse() renders 2, 1, 0.
            // But we need to pass correct original index.
            // Let's stick to standard map and z-index.
            return null;
          })}
          {/* Explicit rendering for Z-order control */}
          {cards.slice(0, 3).reverse().map((card) => {
            const index = cards.indexOf(card);
            // Since we only render 3, the index relative to slice is what matters.
            // Let's just use the component logic below which handles index '0' as top.
            // Wait, mapping over reversed slice is tricky for index props.
            // Let's Map normal order and use Z-Index.
            return null;
          })}

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

      {/* Controls - Floating styling */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-none bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:scale-110 hover:shadow-[0_15px_35px_rgba(239,68,68,0.2)] hover:bg-red-50 transition-all duration-300"
          onClick={() => handleSwipe('LEFT')}
          disabled={isAnimating}
        >
          <X className="h-8 w-8 text-destructive" strokeWidth={3} />
        </Button>

        {lastSwiped && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={handleUndo}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-none bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:scale-110 hover:shadow-[0_15px_35px_rgba(34,197,94,0.2)] hover:bg-green-50 transition-all duration-300"
          onClick={() => handleSwipe('RIGHT')}
          disabled={isAnimating}
        >
          <Heart className="h-8 w-8 text-green-500 fill-green-500" />
        </Button>
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

  // Physics setup
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-300, 0, 300], [0.5, 1, 0.5]); // Fade out on extreme swipe

  // Overlay Opacities
  const likeOpacity = useTransform(x, [20, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -150], [0, 1]);

  // Stack Scale/Y setup
  const scale = 1 - index * 0.04;
  const translateY = index * 12; // Visible stack effect
  const zIndex = 50 - index;

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
        'absolute inset-0 origin-bottom touch-none cursor-grab active:cursor-grabbing',
        !isTop && 'pointer-events-none'
      )}
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : translateY,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex,
        opacity: 1 // Keep background cards visible
      }}
      drag={isTop && !disabled ? 'x' : false} // Lock drag to X axis mostly? Or free? Tinder used free. Let's allowing slight Y.
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing', scale: 1.02 }}
    >
      <div className={cn("relative h-full w-full overflow-hidden rounded-[2.5rem] bg-card shadow-[0_20px_50px_rgba(0,0,0,0.1)] border ring-1", card.isPremium ? "border-amber-400/50 ring-amber-400/20" : "border-white/50 ring-black/5")}>
        {/* Full Bleed Image */}
        <div className="absolute inset-0 bg-secondary/20">
          {card.heroImage ? (
            <Image
              src={card.heroImage.mediumUrl}
              alt={card.title}
              fill
              className="object-cover"
              priority={isTop}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/50">
              No Image
            </div>
          )}

          {/* Overlays */}
          {isTop && (
            <>
              {/* Like Stamp */}
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute left-6 top-8 rounded-xl border-4 border-green-500 px-4 py-2 rotate-[-15deg] z-10 bg-green-500/10 backdrop-blur-sm"
              >
                <span className="font-bold text-2xl text-green-500 tracking-widest">LIKE</span>
              </motion.div>

              {/* Nope Stamp */}
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute right-6 top-8 rounded-xl border-4 border-destructive px-4 py-2 rotate-[15deg] z-10 bg-destructive/10 backdrop-blur-sm"
              >
                <span className="font-bold text-2xl text-destructive tracking-widest">NOPE</span>
              </motion.div>
            </>
          )}

          {card.isPremium && (
            <div className="absolute top-4 right-4 z-10 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-900" /> PREMIUM
            </div>
          )}

          {/* Gradient for Text */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Content Layer */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white pb-8">
          <div className="flex items-end justify-between mb-2">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold leading-tight font-serif drop-shadow-md">
                {card.title}
              </h2>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{card.city}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-2xl font-bold text-primary drop-shadow-md">
                {formatPrice(card.price, card.currency)}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {card.condition && (
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                {card.condition}
              </Badge>
            )}
            {/* Info Button */}
            <Button variant="ghost" size="icon" className="ml-auto rounded-full bg-white/10 hover:bg-white/20 text-white">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeDeckSkeleton() {
  return (
    <div className="relative h-[65vh] max-h-[600px] w-full max-w-sm shrink-0">
      <div className="absolute inset-0 rounded-[2.5rem] bg-secondary animate-pulse shadow-xl" />
    </div>
  );
}
