'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag, X } from 'lucide-react';

const REPORT_REASONS = [
    { id: 'SPAM', label: 'Spam' },
    { id: 'SCAM', label: 'Prevara' },
    { id: 'PROHIBITED_ITEM', label: 'Zabranjen predmet' },
    { id: 'WRONG_CATEGORY', label: 'Pogrešna kategorija' },
    { id: 'DUPLICATE', label: 'Duplikat' },
    { id: 'OFFENSIVE', label: 'Uvredljiv sadržaj' },
    { id: 'OTHER', label: 'Ostalo' },
] as const;

export function ReportModal({ listingId, disabled }: { listingId: string, disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<typeof REPORT_REASONS[number]['id']>('SPAM');
    const [details, setDetails] = useState('');
    const [success, setSuccess] = useState(false);

    const reportMutation = api.report.create.useMutation({
        onSuccess: () => {
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
                setReason('SPAM');
                setDetails('');
            }, 2000);
        }
    });

    const handleSubmit = () => {
        reportMutation.mutate({
            listingId,
            reason,
            details: details.trim() || undefined
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive gap-2 rounded-xl mt-4"
                disabled={disabled}
                onClick={() => setOpen(true)}
            >
                <Flag className="h-4 w-4" />
                Prijavi oglas
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-full"
                            onClick={() => !reportMutation.isLoading && setOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-4 pr-8">
                            <h2 className="text-xl font-bold flex items-center gap-2">Prijavi oglas</h2>
                            <p className="text-sm text-muted-foreground mt-1">Ukoliko smatrate da ovaj oglas krši pravila, prijavite ga.</p>
                        </div>

                        {success ? (
                            <div className="py-6 text-center text-green-600 font-medium">
                                Uspešno poslato. Hvala!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reportMutation.error && (
                                    <p className="text-sm text-destructive">{reportMutation.error.message}</p>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Razlog prijave</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-11 appearance-none rounded-xl border bg-secondary/50 px-4 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value as any)}
                                        >
                                            {REPORT_REASONS.map(r => (
                                                <option key={r.id} value={r.id}>{r.label}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">▼</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Dodatni detalji (opciono)</label>
                                    <Textarea
                                        placeholder="Opišite detaljno problem..."
                                        value={details}
                                        onChange={e => setDetails(e.target.value)}
                                        maxLength={1000}
                                        className="resize-none rounded-xl"
                                    />
                                </div>

                                <Button
                                    className="w-full rounded-xl h-12 shadow-lg hover:shadow-xl transition-all mt-4"
                                    onClick={handleSubmit}
                                    disabled={reportMutation.isLoading}
                                >
                                    {reportMutation.isLoading ? 'Slanje...' : 'Pošalji prijavu'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
