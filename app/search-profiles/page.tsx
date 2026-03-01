'use client';

import { api } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, ArrowLeft, Search, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function SearchProfilesPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: profiles, isLoading } = api.searchProfile.list.useQuery();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', keywords: '', city: '', minPrice: '', maxPrice: '', notifyNew: true });
    const [pushStatus, setPushStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown')

    useEffect(() => {
        if ('Notification' in window) setPushStatus(Notification.permission as any)
    }, [])

    const handleEnablePush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Vaš pregledač ne podržava notifikacije.')
            return
        }
        const permission = await Notification.requestPermission()
        setPushStatus(permission as any)
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        })

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub }),
        })
    }

    const createMutation = api.searchProfile.create.useMutation({
        onSuccess: () => {
            setIsModalOpen(false);
            setFormData({ name: '', keywords: '', city: '', minPrice: '', maxPrice: '', notifyNew: true });
            utils.searchProfile.list.invalidate();
        }
    });

    const deleteMutation = api.searchProfile.delete.useMutation({
        onSuccess: () => utils.searchProfile.list.invalidate()
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-32">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 rounded-full" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Moje Pretrage</h1>
                </div>
                {profiles && profiles.length > 0 && profiles.length < 5 && (
                    <Button onClick={() => setIsModalOpen(true)} className="rounded-xl flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Pretraga
                    </Button>
                )}
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-3xl border border-primary/10">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-primary">
                    <Bell className="h-5 w-5" />
                    Budite prvi koji saznaju
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    Pratite oglase i dobijajte obaveštenja čim se pojavi nešto novo po vašem ukusu. Sačuvajte do 5 specifičnih pretraga po ključnim rečima, lokaciji ili ceni.
                </p>
            </div>

            {pushStatus !== 'granted' && (
                <button
                    onClick={handleEnablePush}
                    className="w-full bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl py-3 text-sm font-medium mb-4"
                >
                    🔔 Dozvoli notifikacije za nove oglase
                </button>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-black/5 rounded-full" />
                    <div className="h-4 w-32 bg-black/5 rounded" />
                </div>
            ) : profiles?.length === 0 ? (
                <div className="py-16 text-center bg-white/50 rounded-[2rem] border border-black/5 flex flex-col items-center gap-4 shadow-sm">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <Search className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-lg">Nemate sačuvanih pretraga.</div>
                    <p className="text-muted-foreground text-sm max-w-sm">Napravite specifičnu pretragu da biste pratili parametre i obaveštenja.</p>
                    <Button className="mt-4 rounded-xl px-8" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Napravi pretragu
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {profiles?.map((profile: any) => (
                        <div key={profile.id} className="p-5 md:p-6 rounded-3xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-black/5 flex items-start justify-between group hover:shadow-md hover:border-black/10 transition-all">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg leading-none">{profile.name}</h3>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                                        {format(profile.createdAt, 'dd.MM.yyyy')}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm mt-3">
                                    {profile.keywords && profile.keywords.length > 0 && (
                                        profile.keywords.map((kw: string) => (
                                            <span key={kw} className="bg-secondary px-2.5 py-1 rounded-lg text-secondary-foreground font-medium">#{kw}</span>
                                        ))
                                    )}
                                    {profile.minPrice && (
                                        <span className="bg-secondary px-2.5 py-1 rounded-lg text-secondary-foreground font-medium">Min: {profile.minPrice}</span>
                                    )}
                                    {profile.maxPrice && (
                                        <span className="bg-secondary px-2.5 py-1 rounded-lg text-secondary-foreground font-medium">Max: {profile.maxPrice}</span>
                                    )}
                                    {profile.city && (
                                        <span className="bg-secondary px-2.5 py-1 rounded-lg text-secondary-foreground font-medium">Lokacija: {profile.city}</span>
                                    )}
                                    {profile.notifyNew && (
                                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                                            <Bell className="w-3 h-3" /> Obaveštenja
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full h-10 w-10 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                                onClick={() => deleteMutation.mutate({ id: profile.id })}
                                disabled={deleteMutation.isLoading}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative">
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full hover:bg-black/5" onClick={() => setIsModalOpen(false)}>
                            <X className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <h2 className="text-2xl font-bold mb-4">Nova Pretraga</h2>

                        <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            createMutation.mutate({
                                name: formData.name,
                                keywords: formData.keywords ? formData.keywords.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                                city: formData.city || undefined,
                                minPrice: formData.minPrice ? Number(formData.minPrice) : undefined,
                                maxPrice: formData.maxPrice ? Number(formData.maxPrice) : undefined,
                                notifyNew: formData.notifyNew
                            });
                        }}>
                            <div>
                                <label className="block text-sm font-bold mb-1">Naziv pretrage</label>
                                <input required type="text" className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="Npr. Macbook Pro" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Ključne reči (odvojene zarezom)</label>
                                <input type="text" className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" placeholder="m2, 16gb, ssd" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Grad</label>
                                <input type="text" className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" placeholder="Beograd" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold mb-1">Min. cena</label>
                                    <input type="number" className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" placeholder="0" value={formData.minPrice} onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold mb-1">Max. cena</label>
                                    <input type="number" className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" placeholder="1000" value={formData.maxPrice} onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })} />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mt-2 bg-secondary/30 p-3 rounded-xl">
                                <input type="checkbox" className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary h-4 w-4 rounded" checked={formData.notifyNew} onChange={(e) => setFormData({ ...formData, notifyNew: e.target.checked })} />
                                <span className="text-sm font-medium">Šaljite mi obaveštenja o novim oglasima</span>
                            </label>

                            <Button disabled={createMutation.isLoading || !formData.name} type="submit" className="w-full rounded-xl py-6 mt-4 font-bold text-lg">
                                {createMutation.isLoading ? 'Čuvam...' : 'Sačuvaj pretragu'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
