'use client'
import { useState } from 'react'
import { api } from '@/lib/trpc'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ListingCard } from '@/components/listings/ListingCard'
import { Settings, MapPin, Star, LogOut, Edit2, Check, X, ShieldCheck } from 'lucide-react'
import { PhoneVerification } from '@/components/profile/PhoneVerification'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const utils = api.useUtils()

  const { data: user, isLoading } = api.user.me.useQuery()
  const { data: listings } = api.listing.myListings.useQuery({})

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editBio, setEditBio] = useState('')

  const updateProfile = api.user.update.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate()
      setIsEditing(false)
    }
  })

  const startEditing = () => {
    setEditName(user?.name ?? '')
    setEditCity(user?.city ?? '')
    setEditBio((user as any)?.bio ?? '')
    setIsEditing(true)
  }

  const handleSave = () => {
    updateProfile.mutate({
      name: editName,
      city: editCity,
      bio: editBio,
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  // Using `api.listing.myListings` which returns `items`. 
  // Map or filter those items.
  const activeListings = listings?.items.filter(l => l.status === 'ACTIVE') ?? []
  const soldListings = listings?.items.filter(l => l.status === 'SOLD') ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">

      {/* Profile header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name ?? ''} className="w-full h-full object-cover" />
              ) : (
                (user.name?.slice(0, 1) ?? user.email?.slice(0, 1) ?? 'U').toUpperCase()
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ime i prezime"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  placeholder="Grad"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Kratki opis (opcionalno)"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateProfile.isLoading}
                    className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-xl"
                  >
                    <Check className="w-4 h-4" />
                    Sačuvaj
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 text-xs border border-gray-200 text-gray-500 px-4 py-2 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-900 text-xl truncate">
                    {user.name ?? 'Postavi ime'}
                  </h1>
                  {user.isVerified && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verifikovan
                    </span>
                  )}
                </div>
                {user.city && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {user.city}
                  </div>
                )}
                {/* Note: User model does not currently have `bio` property in API response but db might have it and we update it.
                  Let's ignore displaying bio if it's not exported in the api definition unless we update it. */}
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Član od {new Date(user.createdAt).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}
                </p>
              </>
            )}
          </div>

          {/* Edit button */}
          {!isEditing && (
            <button
              onClick={startEditing}
              className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-foreground shrink-0 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-black/5">
          <div className="text-center flex-1">
            <p className="text-2xl font-black text-gray-900">{activeListings.length}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktivni</p>
          </div>
          <div className="w-px h-10 bg-black/5" />
          <div className="text-center flex-1">
            <p className="text-2xl font-black text-gray-900">{soldListings.length}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prodato</p>
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

      {/* Phone Verification */}
      <PhoneVerification currentPhone={user.phone} phoneVerifiedAt={user.phoneVerifiedAt} />

      {/* My listings */}
      {listings?.items && listings.items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-bold text-lg text-gray-900">Moji oglasi</h2>
            <span className="text-sm font-medium text-muted-foreground">{listings.items.length} ukupno</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.items.slice(0, 6).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {listings.items.length > 6 && (
            <button className="w-full mt-4 text-sm bg-secondary/50 hover:bg-secondary text-foreground font-semibold py-3 rounded-2xl transition-colors">
              Prikaži sve oglase ({listings.items.length})
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl ring-1 ring-black/5 shadow-sm overflow-hidden mt-6">
        <SettingsRow icon={<Settings className="w-5 h-5 text-gray-400" />} label="Podešavanja naloga" />
        <SettingsRow icon={<Star className="w-5 h-5 text-amber-400" />} label="Premium nalog" badge="PREMIUM" onClick={() => { }} />
        {user.isAdmin && (
          <SettingsRow
            icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
            label="Admin Panel"
            labelColor="text-blue-600"
            onClick={() => router.push('/admin')}
          />
        )}
        <SettingsRow
          icon={<LogOut className="w-5 h-5" />}
          label="Odjavi se"
          labelColor="text-red-500"
          iconColor="text-red-500"
          onClick={handleSignOut}
          showArrow={false}
        />
      </div>

    </div>
  )
}

function SettingsRow({
  icon,
  label,
  badge,
  onClick,
  labelColor = 'text-gray-700',
  showArrow = true,
}: {
  icon: React.ReactNode
  label: string
  badge?: string
  onClick?: () => void
  labelColor?: string
  iconColor?: string
  showArrow?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 border-b border-black/5 last:border-0 transition-colors"
    >
      <span className="shrink-0">{icon}</span>
      <span className={`flex-1 text-sm font-semibold text-left ${labelColor}`}>{label}</span>
      {badge && (
        <span className="text-[10px] bg-amber-100/50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          {badge}
        </span>
      )}
      {showArrow && <span className="text-gray-300">›</span>}
    </button>
  )
}
