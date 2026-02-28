'use client';

import { api } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatPrice, ROUTES } from '@/lib/constants';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: user, isLoading: isUserLoading } = api.user.me.useQuery();

    const { data: queue, isLoading: isQueueLoading } = api.admin.getQueue.useQuery(undefined, {
        enabled: !!user?.isAdmin
    });

    const { data: reports, isLoading: isReportsLoading } = api.admin.getReports.useQuery(undefined, {
        enabled: !!user?.isAdmin
    });

    const approveListing = api.admin.approveListing.useMutation({
        onSuccess: () => utils.admin.getQueue.invalidate()
    });

    const rejectListing = api.admin.rejectListing.useMutation({
        onSuccess: () => utils.admin.getQueue.invalidate()
    });

    const resolveReport = api.admin.resolveReport.useMutation({
        onSuccess: () => utils.admin.getReports.invalidate()
    });

    if (isUserLoading) {
        return <div className="p-8 text-center text-muted-foreground">Učitavanje admin panela...</div>;
    }

    if (!user?.isAdmin) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Nemate pristup</h2>
                <p className="text-muted-foreground">Samo za administratore.</p>
                <Button onClick={() => router.push('/')} className="rounded-xl mt-4">Nazad na početnu</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 pb-32">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Pristup za zaposlene, odobravajte oglase i rešavajte prijave.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Moderacija oglasa ({queue?.length ?? 0})</h2>
                {isQueueLoading ? (
                    <div className="p-8 text-center">Učitavanje...</div>
                ) : queue?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-3xl border border-black/5">
                        Svi oglasi su obrađeni.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {queue?.map((listing) => (
                            <div key={listing.id} className="flex flex-col md:flex-row gap-4 p-5 rounded-3xl bg-white shadow-sm border border-black/5 items-center justify-between transition-all hover:shadow-md">
                                <div className="flex-1 w-full">
                                    <Link href={ROUTES.listing(listing.slug)} target="_blank" className="font-bold text-[17px] hover:underline decoration-primary/50 underline-offset-4">
                                        {listing.title}
                                    </Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-3">{listing.description}</p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="font-semibold">{formatPrice(listing.price, listing.currency)}</Badge>
                                        <Badge variant="outline">Moderation Score: {listing.moderation_score}</Badge>
                                        {listing.moderation_flags?.map((f: string) => (
                                            <Badge key={f} variant="secondary" className="bg-red-50 text-red-700">{f}</Badge>
                                        ))}
                                        <span className="text-xs text-muted-foreground ml-2">Obajvljeno: {format(new Date(listing.created_at), 'dd.MM')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                    <Button variant="outline" size="sm" className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700 h-10 w-full rounded-xl md:w-32" onClick={() => approveListing.mutate({ id: listing.id })} disabled={approveListing.isLoading}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Odobri
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700 h-10 w-full rounded-xl md:w-32" onClick={() => rejectListing.mutate({ id: listing.id })} disabled={rejectListing.isLoading}>
                                        <XCircle className="h-4 w-4 mr-2" /> Odbij
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Prijavljeni sadržaj ({reports?.length ?? 0})</h2>
                {isReportsLoading ? (
                    <div className="p-8 text-center">Učitavanje...</div>
                ) : reports?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-3xl border border-black/5">
                        Nema prijavljenog sadržaja.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reports?.map((report) => (
                            <div key={report.id} className="flex flex-col md:flex-row gap-4 p-5 rounded-3xl bg-white shadow-sm border border-black/5 items-center justify-between hover:shadow-md transition-all">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="bg-red-500 text-white hover:bg-red-600 uppercase font-bold tracking-wider text-[10px]">{report.reason}</Badge>
                                        <span className="text-xs text-muted-foreground">{format(new Date(report.created_at), 'dd.MM H:mm')}</span>
                                    </div>
                                    <p className="text-sm font-medium">{report.details || 'Nema dodatnih detalja (samo oznaka). '}</p>
                                    <div className="text-[13px] text-muted-foreground mt-3 flex flex-col gap-0.5">
                                        <div><span className="font-semibold">Prijavio:</span> {report.reporter_id}</div>
                                        {report.listing_id && <div><span className="font-semibold">Oglas:</span> {report.listing_id}</div>}
                                        {report.reported_user_id && <div><span className="font-semibold">Korisnik:</span> {report.reported_user_id}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                    <Button variant="outline" size="sm" className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700 h-10 w-full rounded-xl md:w-32" onClick={() => resolveReport.mutate({ id: report.id, status: 'RESOLVED' })} disabled={resolveReport.isLoading}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Rešeno
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-10 w-full rounded-xl md:w-32 text-muted-foreground hover:text-black" onClick={() => resolveReport.mutate({ id: report.id, status: 'DISMISSED' })} disabled={resolveReport.isLoading}>
                                        Zanemari
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
