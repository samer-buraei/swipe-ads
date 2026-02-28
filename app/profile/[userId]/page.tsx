'use client';

import { api } from '@/lib/trpc'
import { ListingCard } from '@/components/listings/ListingCard'
import { MapPin } from 'lucide-react'

interface PublicProfilePageProps {
    params: { userId: string }
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { data: profile } = api.user.get.useQuery({ id: params.userId })
    const { data: listings } = api.listing.list.useQuery({
        userId: params.userId
    })

    if (!profile) return (
        <div className="max-w-2xl flex flex-col items-center justify-center min-h-[50vh] mx-auto text-center animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="h-5 bg-gray-200 rounded w-1/3 mt-4" />
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
            {/* Profile header */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.name ?? ''} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            (profile.name?.slice(0, 1) ?? 'U').toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-gray-900 text-xl">{profile.name ?? 'Korisnik'}</h1>
                            {profile.isVerified && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Verifikovan
                                </span>
                            )}
                        </div>
                        {profile.city && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4" />
                                {profile.city}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-2">
                            Član od {new Date(profile.memberSince).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-5 border-t border-black/5">
                    <div className="text-center flex-1">
                        <p className="text-2xl font-black text-gray-900">{profile.activeListings}</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktivni Oglasi</p>
                    </div>
                    <div className="w-px h-10 bg-black/5" />
                    <div className="text-center flex-1">
                        <p className="text-2xl font-black text-gray-900">
                            —
                        </p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ocena <span className="text-amber-400">★</span></p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="font-bold text-lg text-gray-900 mb-4 px-1">Oglasi prodavca</h2>
                {listings?.items && listings.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listings.items.map(listing => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-3xl">
                        Nema aktivnih oglasa
                    </div>
                )}
            </div>
        </div>
    )
}
