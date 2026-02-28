'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Phone as PhoneIcon, KeyRound } from 'lucide-react';

export function PhoneVerification({
    currentPhone,
    phoneVerifiedAt
}: {
    currentPhone: string | null;
    phoneVerifiedAt?: Date | null;
}) {
    const [phone, setPhone] = useState(currentPhone || '+381');
    const [token, setToken] = useState('');
    const [step, setStep] = useState<'input' | 'verify' | 'done'>('input');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const supabase = createClient();
    const utils = api.useUtils();
    const updateUser = api.user.update.useMutation();

    const handleSendOtp = async () => {
        setLoading(true);
        setError('');
        const { error: otpError } = await supabase.auth.signInWithOtp({
            phone,
        });

        setLoading(false);
        if (otpError) {
            setError(otpError.message);
        } else {
            setStep('verify');
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        const { error: vError } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });

        if (vError) {
            setError(vError.message);
            setLoading(false);
        } else {
            const now = new Date().toISOString();
            await updateUser.mutateAsync({ phone, phoneVerifiedAt: now });

            // Update the verify user trigger in supabase manually, but for UI sake invalidate
            await utils.user.me.invalidate();

            setStep('done');
            setLoading(false);
        }
    };

    if (phoneVerifiedAt && currentPhone) {
        return (
            <div className="flex items-center justify-between bg-green-50/50 p-4 rounded-3xl border border-green-100 mt-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-green-900 text-sm">Broj je verifikovan</div>
                        <div className="text-green-700/80 text-xs">{currentPhone}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-2">
                <PhoneIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Verifikacija Broja</h3>
            </div>

            {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

            {step === 'input' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">Povežite broj telefona da biste stekli oznaku <b>Verifikovan</b> i izgradili poverenje sa kupcima.</p>
                    <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full h-11 border border-black/10 rounded-xl px-4 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="+381..."
                    />
                    <Button className="w-full rounded-xl h-11" onClick={handleSendOtp} disabled={loading || phone.length < 9}>
                        {loading ? 'Slanje...' : 'Pošalji SMS Kod'}
                    </Button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Unesite 6-cifreni kod koji smo poslali na <b>{phone}</b></p>
                    <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            className="w-full h-11 border border-black/10 rounded-xl pl-10 pr-4 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium tracking-widest text-lg"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => setStep('input')} disabled={loading}>
                            Nazad
                        </Button>
                        <Button className="w-full rounded-xl h-11" onClick={handleVerify} disabled={loading || token.length < 6}>
                            {loading ? 'Provera...' : 'Potvrdi Kod'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className="text-center py-4 space-y-2">
                    <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-green-900 text-lg">Uspešno verifikovano!</h4>
                    <p className="text-sm text-green-700/80">Vaš broj telefona je povezan.</p>
                </div>
            )}
        </div>
    );
}
