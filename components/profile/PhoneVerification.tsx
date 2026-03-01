'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/trpc'
import { toE164Serbian, isValidSerbianMobile } from '@/lib/utils'

interface PhoneVerificationProps {
    currentPhone?: string | null
    onVerified: (phone: string) => void
}

export function PhoneVerification({ currentPhone, onVerified }: PhoneVerificationProps) {
    const [step, setStep] = useState<'idle' | 'phone' | 'otp'>('idle')
    const [phone, setPhone] = useState('')
    const [e164Phone, setE164Phone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [countdown, setCountdown] = useState(0)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (countdown <= 0) return
        const t = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [countdown])

    const sendOtp = api.auth.sendOtp.useMutation({
        onSuccess: () => { setStep('otp'); setCountdown(60); setError('') },
        onError: (err) => setError(err.message),
    })

    const verifyOtp = api.auth.verifyOtp.useMutation({
        onSuccess: () => { onVerified(e164Phone); setStep('idle') },
        onError: (err) => { setError(err.message); setOtp(['', '', '', '', '', '']) },
    })

    const handleSend = () => {
        const converted = toE164Serbian(phone)
        if (!isValidSerbianMobile(converted)) {
            setError('Unesite validan srpski mobilni broj')
            return
        }
        setE164Phone(converted)
        sendOtp.mutate({ phone: converted })
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const next = [...otp]
        next[index] = value
        setOtp(next)
        if (value && index < 5) otpRefs.current[index + 1]?.focus()
        if (next.every(d => d) && next.join('').length === 6) {
            verifyOtp.mutate({ phone: e164Phone, token: next.join('') })
        }
    }

    if (step === 'idle') {
        return (
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                <div>
                    <p className="text-sm font-medium text-gray-700">Telefon</p>
                    <p className="text-sm text-gray-400">{currentPhone ?? 'Nije dodat'}</p>
                </div>
                <button
                    onClick={() => setStep('phone')}
                    className="text-sm text-indigo-500 font-medium hover:underline"
                >
                    {currentPhone ? 'Promeni' : 'Dodaj'}
                </button>
            </div>
        )
    }

    if (step === 'phone') {
        return (
            <div className="space-y-3 p-4 border border-indigo-100 rounded-2xl bg-indigo-50">
                <p className="text-sm font-medium text-gray-700">Dodaj broj telefona</p>
                <div className="flex gap-2">
                    <span className="text-sm text-gray-500 self-center shrink-0">🇷🇸 +381</span>
                    <input
                        type="tel"
                        placeholder="64 123 4567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                        autoFocus
                    />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <button
                        onClick={handleSend}
                        disabled={sendOtp.isLoading}
                        className="flex-1 bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                        {sendOtp.isLoading ? 'Slanje...' : 'Pošalji kod'}
                    </button>
                    <button
                        onClick={() => { setStep('idle'); setError('') }}
                        className="px-4 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                        Otkaži
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3 p-4 border border-indigo-100 rounded-2xl bg-indigo-50">
            <p className="text-sm text-gray-600">Unesite kod primljen na {phone}</p>
            <div className="flex gap-1.5">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => e.key === 'Backspace' && !otp[i] && i > 0 && otpRefs.current[i - 1]?.focus()}
                        className="w-10 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none bg-white"
                        autoFocus={i === 0}
                    />
                ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {countdown > 0 ? (
                <p className="text-xs text-gray-400">Ponovo za {countdown}s</p>
            ) : (
                <button
                    onClick={() => { setOtp(['', '', '', '', '', '']); sendOtp.mutate({ phone: e164Phone }) }}
                    className="text-xs text-indigo-500 hover:underline"
                >
                    Pošalji ponovo
                </button>
            )}
        </div>
    )
}
