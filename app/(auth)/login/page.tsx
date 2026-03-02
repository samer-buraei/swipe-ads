'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc'
import { createClient } from '@/lib/supabase/client'
import { toE164Serbian, isValidSerbianMobile } from '@/lib/utils'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')          // raw input, e.g. "064 123 4567"
  const [e164Phone, setE164Phone] = useState('')  // converted, e.g. "+381641234567"
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const sendOtp = api.auth.sendOtp.useMutation({
    onSuccess: () => {
      setStep('otp')
      setResendCountdown(60)
      setError('')
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const verifyOtp = api.auth.verifyOtp.useMutation({
    onSuccess: async (data) => {
      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      })
      router.push('/')
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
      // Clear OTP fields on wrong code
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    },
  })

  const handleSendOtp = () => {
    setError('')
    const converted = toE164Serbian(phone)
    if (!isValidSerbianMobile(converted)) {
      setError('Unesite validan srpski mobilni broj (npr. 064 123 4567)')
      return
    }
    setE164Phone(converted)
    sendOtp.mutate({ phone: converted })
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return // only single digits
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
    // Auto-submit when all 6 digits filled
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      verifyOtp.mutate({ phone: e164Phone, token: newOtp.join('') })
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8 space-y-6">

        {/* Logo / Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">SwipeMarket</h1>
          <p className="text-sm text-gray-400 mt-1">Prodaj i kupi brzo</p>
        </div>

        {/* STEP 1: Phone input */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Broj telefona
              </label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300 transition">
                <span className="text-sm text-gray-500 shrink-0">🇷🇸 +381</span>
                <div className="w-px h-4 bg-gray-200" />
                <input
                  type="tel"
                  placeholder="64 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="flex-1 text-sm outline-none bg-transparent text-gray-900"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={sendOtp.isLoading || !phone.trim()}
              className="w-full bg-indigo-500 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendOtp.isLoading ? 'Slanje...' : 'Pošalji kod'}
            </button>
          </div>
        )}

        {/* STEP 2: OTP input */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Poslali smo kod na{' '}
                <span className="font-semibold text-gray-900">{phone}</span>
              </p>
            </div>

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { otpRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center">{error}</p>
            )}

            <button
              onClick={() => verifyOtp.mutate({ phone: e164Phone, token: otp.join('') })}
              disabled={verifyOtp.isLoading || otp.some(d => !d)}
              className="w-full bg-indigo-500 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyOtp.isLoading ? 'Provera...' : 'Potvrdi'}
            </button>

            {/* Resend link */}
            <p className="text-center text-sm text-gray-400">
              {resendCountdown > 0 ? (
                <>Ponovo za <span className="font-medium text-gray-600">{resendCountdown}s</span></>
              ) : (
                <button
                  onClick={() => {
                    setOtp(['', '', '', '', '', ''])
                    sendOtp.mutate({ phone: e164Phone })
                  }}
                  className="text-indigo-500 hover:underline font-medium"
                >
                  Nisam primio kod — pošalji ponovo
                </button>
              )}
            </p>

            {/* Back to phone input */}
            <button
              onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600"
            >
              ← Promeni broj
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">ili</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Google OAuth fallback */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-2xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Nastavi sa Google
        </button>

      </div>
    </div>
  )
}
