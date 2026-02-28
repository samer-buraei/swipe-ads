'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { MapPin, Phone, ShieldCheck, Share2, Heart, ArrowLeft, MessageCircle } from 'lucide-react';
import { api } from '@/lib/trpc';
import { formatDate } from '@/lib/utils';
import { formatPrice, ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ReportModal } from '@/components/listings/ReportModal';

export default function ListingDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading, error } = api.listing.get.useQuery({ slug: params.slug });

  const { data: user } = api.user.me.useQuery();

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(d => setExchangeRate(d.rate))
      .catch(() => setExchangeRate(117.5));
  }, []);

  const sendMessage = api.message.send.useMutation({
    onSuccess: ({ conversationId }) => {
      router.push(ROUTES.conversation(conversationId))
    }
  })

  // Favorite toggle logic
  const [localFavorite, setLocalFavorite] = useState(false);
  useEffect(() => {
    if (data?.isFavorited !== undefined) {
      setLocalFavorite(data.isFavorited);
    }
  }, [data?.isFavorited]);

  const toggleFavorite = api.favorite.toggle.useMutation({
    onSuccess: (res) => {
      setLocalFavorite(res.isFavorited);
    }
  });

  const handleFavoriteClick = () => {
    if (!data) return;
    if (!user) {
      router.push('/login');
      return;
    }
    toggleFavorite.mutate({ listingId: data.id });
  };

  // Share logic
  const handleShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `Pogledaj oglas: ${data.title} na SwipeMarket!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link je kopiran u spremnik!');
    }
  };

  // Prevent messaging if the listing belongs to the logged-in user
  const isOwnListing = user?.id === data?.seller?.id;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-[50vh] bg-secondary/30 rounded-b-[3rem]" />
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="h-8 w-2/3 bg-secondary/30 rounded-xl" />
          <div className="h-4 w-1/3 bg-secondary/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-2">Oglas nije pronađen</h2>
        <Button onClick={() => router.push('/')}>Vrati se na početnu</Button>
      </div>
    );
  }

  const handleContact = () => {
    sendMessage.mutate({
      listingId: data.id,
      receiverId: data.seller.id,
      content: `Zdravo, zainteresovan/a sam za oglas "${data.title}". Da li je još uvek dostupno?`,
    })
  }

  return (
    <div className="pb-32 bg-background min-h-screen">
      {/* Immersive Hero Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-secondary overflow-hidden">
        {data.images[0] ? (
          <Image
            src={data.images[0].mediumUrl}
            alt={data.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50 bg-secondary">
            Nema slike
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pt-safe">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={cn("rounded-full shadow-lg bg-white/90 backdrop-blur-sm transition-all", localFavorite && "text-red-500 hover:text-red-600")}
              onClick={handleFavoriteClick}
              disabled={toggleFavorite.isLoading}
            >
              <Heart className={cn("h-5 w-5 transition-all", localFavorite && "fill-current scale-110")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {/* Header Info */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent px-3 py-1">
                  {data.condition === 'NEW' && 'Novo'}
                  {data.condition === 'LIKE_NEW' && 'Kao novo'}
                  {data.condition === 'GOOD' && 'Dobro'}
                  {data.condition === 'FAIR' && 'Korišćeno'}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {data.city}
                </span>
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-2">
                {data.title}
              </h1>

              <div className="flex items-baseline gap-2 text-primary">
                <span className="text-3xl font-bold tracking-tight">
                  {formatPrice(data.price, data.currency)}
                </span>
                {exchangeRate && (
                  <span className="text-xl font-normal text-muted-foreground opacity-80 ml-1 pb-1">
                    ≈ {data.currency === 'RSD'
                      ? `${Math.round(data.price / exchangeRate).toLocaleString('sr-RS')} €`
                      : `${Math.round(data.price * exchangeRate).toLocaleString('sr-RS')} RSD`}
                  </span>
                )}
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-[2rem] bg-card p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5">
              <h3 className="font-bold text-lg mb-4">Opis</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {data.description}
              </p>
            </div>

            {/* Gallery Preview (if more images) */}
            {data.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                {data.images.map((img) => (
                  <div key={img.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary snap-start">
                    <Image src={img.thumbUrl} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {/* Seller Card */}
            <div className="rounded-[2rem] bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5 sticky top-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                  {data.seller.name?.slice(0, 1) ?? 'K'}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Prodavac</div>
                  <div className="font-bold text-lg flex items-center gap-1.5">
                    {data.seller.name ?? 'Korisnik'}
                    {data.seller.isVerified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {data.seller.phone && (
                  <div className="flex items-center gap-3 text-sm font-medium p-3 bg-secondary/50 rounded-xl">
                    <Phone className="h-4 w-4 text-primary" />
                    {data.seller.phone}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm font-medium p-3 bg-secondary/50 rounded-xl">
                  <MapPin className="h-4 w-4 text-primary" />
                  {data.city}
                </div>
              </div>

              {!isOwnListing ? (
                <Button
                  className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20 gap-2"
                  onClick={handleContact}
                  disabled={sendMessage.isLoading}
                >
                  <MessageCircle className="h-5 w-5" />
                  {sendMessage.isLoading ? 'Učitavanje...' : 'Kontaktiraj prodavca'}
                </Button>
              ) : (
                <Button
                  className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20 gap-2"
                  variant="outline"
                  onClick={() => router.push(ROUTES.profile)}
                >
                  Ovo je vaš oglas
                </Button>
              )}

              <ReportModal listingId={data.id} disabled={!user} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
