# PHASE 4 — STEP 2: Phone OTP Authentication
**Prerequisite:** PHASE4_STEP1_BLOCKERS.md complete
**Estimated time:** 4 tasks × ~30 minutes = ~2 hours

---

## Session context header (paste at the top of every agent session for this step)

```
PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2
AUTH: Supabase Auth (Google OAuth + Phone OTP) — NO NextAuth
DB: Supabase hosted PostgreSQL — supabase client only, never raw Prisma
KEY RULE: tRPC v10 — mutations use isLoading NOT isPending
ROOT: C:\Users\sam\Desktop\swipemarket\
CURRENT TASK: [paste the specific task heading below]
```

---

## TASK 2.1 — Enable Supabase Phone Provider (dashboard only, no code)

**This is a manual configuration step. No files to edit.**

1. Go to https://supabase.com/dashboard → project `awbtohtpjrqlxfoqtita`
2. Click **Authentication** → **Providers**
3. Find **Phone** and click to expand
4. Toggle **Enable Phone provider** ON
5. Under SMS Provider, select **Twilio**
6. Enter:
   - Account SID: your Twilio Account SID (from https://console.twilio.com)
   - Auth Token: your Twilio Auth Token
   - Message Service SID: your Twilio Messaging Service SID (or leave blank and use phone number)
   - Phone Number: your Twilio verified phone number (format: +1XXXXXXXXXX)
7. Click **Save**

**Done when:** You can go to Authentication → Users → Invite a user by phone number without getting a provider error.

---

## TASK 2.2 — Add phone helper functions to `lib/utils.ts`

**Files to read first:** `lib/utils.ts` (read the whole file — add functions at the bottom)

**Add these 3 functions to the END of `lib/utils.ts`:**

```typescript
/**
 * Converts a local Serbian phone number to E.164 international format.
 * Examples:
 *   "0641234567"    → "+381641234567"
 *   "064 123 4567"  → "+381641234567"
 *   "+381641234567" → "+381641234567"  (unchanged)
 */
export function toE164Serbian(local: string): string {
  const digits = local.replace(/\D/g, '')
  if (digits.startsWith('381')) return `+${digits}`
  if (digits.startsWith('0')) return `+381${digits.slice(1)}`
  return `+381${digits}`
}

/**
 * Formats an E.164 Serbian number for display.
 * Example: "+381641234567" → "064 123 4567"
 */
export function formatSerbianPhone(e164: string): string {
  const local = e164.replace(/^\+381/, '0')
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return local
}

/**
 * Returns true if the string is a valid Serbian mobile number in E.164 format.
 * Serbian mobile prefixes: 060, 061, 062, 063, 064, 065, 066, 067, 069
 */
export function isValidSerbianMobile(e164: string): boolean {
  return /^\+3816[0-79]\d{7}$/.test(e164)
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

**Done when:** File saves cleanly and typecheck passes.

---

## TASK 2.3 — Create the auth tRPC router

**Files to read first:**
- `server/api/trpc.ts` (to understand publicProcedure)
- `server/api/root.ts` (to see how other routers are registered)
- `lib/supabase/server.ts` (to see createServerSupabaseClient)

**Create new file `server/api/routers/auth.ts`:**

```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { createServerSupabaseClient } from '../../../lib/supabase/server'

const serbianPhoneSchema = z.string().refine(
  (val) => /^\+3816[0-79]\d{7}$/.test(val),
  { message: 'Unesite validan srpski mobilni broj (npr. +381641234567)' }
)

export const authRouter = createTRPCRouter({
  /**
   * Step 1 of phone OTP: send a 6-digit SMS code to the given phone number.
   * The phone must be in E.164 format: +381XXXXXXXXX
   */
  sendOtp: publicProcedure
    .input(z.object({ phone: serbianPhoneSchema }))
    .mutation(async ({ input }) => {
      const supabase = createServerSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        phone: input.phone,
      })
      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message ?? 'Greška pri slanju koda. Pokušajte ponovo.',
        })
      }
      return { success: true }
    }),

  /**
   * Step 2 of phone OTP: verify the 6-digit code the user received by SMS.
   * On success, Supabase sets a session cookie automatically.
   */
  verifyOtp: publicProcedure
    .input(z.object({
      phone: serbianPhoneSchema,
      token: z.string().length(6, 'Kod mora imati tačno 6 cifara').regex(/^\d{6}$/, 'Kod sme da sadrži samo cifre'),
    }))
    .mutation(async ({ input }) => {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.auth.verifyOtp({
        phone: input.phone,
        token: input.token,
        type: 'sms',
      })
      if (error || !data.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Neispravan ili istekao kod. Pokušajte ponovo.',
        })
      }
      return { success: true, userId: data.user.id }
    }),

  /**
   * Add a phone number to an existing Google OAuth account.
   * Sends OTP to the provided phone — user must then call verifyOtp.
   */
  addPhone: protectedProcedure
    .input(z.object({ phone: serbianPhoneSchema }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServerSupabaseClient()
      const { error } = await supabase.auth.updateUser({ phone: input.phone })
      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message ?? 'Greška pri dodavanju broja telefona.',
        })
      }
      return { success: true }
    }),
})
```

**Now register the router in `server/api/root.ts`:**

Open `server/api/root.ts`. Find the imports at the top and add:
```typescript
import { authRouter } from './routers/auth'
```

Find the `createTRPCRouter({` call and add `auth: authRouter,` — keep all existing routers:
```typescript
export const appRouter = createTRPCRouter({
  auth: authRouter,        // ADD THIS LINE
  listing: listingRouter,
  category: categoryRouter,
  favorite: favoriteRouter,
  swipe: swipeRouter,
  user: userRouter,
  message: messageRouter,
  report: reportRouter,
  searchProfile: searchProfileRouter,
  admin: adminRouter,
})
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

**Done when:** Typecheck passes with 0 errors.

---

## TASK 2.4 — Build the Phone OTP login page

**Files to read first:**
- `app/(auth)/login/page.tsx` (read the entire existing file — you will replace or extend it)
- `lib/utils.ts` (to use toE164Serbian and isValidSerbianMobile you added in Task 2.2)

**Replace the entire contents of `app/(auth)/login/page.tsx` with:**

```typescript
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
    onSuccess: () => {
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Nastavi sa Google
        </button>

      </div>
    </div>
  )
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

Then open http://localhost:3000/login in your browser and confirm:
- The phone input with 🇷🇸 +381 prefix appears
- Entering a number and clicking "Pošalji kod" shows the 6-box OTP screen (real SMS will send if Twilio is configured)
- The Google button appears below the divider

**Done when:** Login page renders with no TypeScript errors and the UI matches the description above.

---

## TASK 2.5 — Wire PhoneVerification into the profile page

**Files to read first:**
- `components/profile/PhoneVerification.tsx` (read the existing scaffold)
- `app/profile/page.tsx` (read the whole file — find where to add the component)

**Replace the entire content of `components/profile/PhoneVerification.tsx` with:**

```typescript
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
```

**Now add PhoneVerification to `app/profile/page.tsx`:**

Open `app/profile/page.tsx`. Find the imports at the top and add:
```typescript
import { PhoneVerification } from '@/components/profile/PhoneVerification'
```

Find where the profile fields are rendered (name, city, bio) and add the PhoneVerification component in that section:
```tsx
<PhoneVerification
  currentPhone={profile?.phone ?? null}
  onVerified={(phone) => {
    // Optimistically show new phone in UI
    // The real phone is stored in Supabase Auth, profile will refresh on next load
  }}
/>
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

**Done when:** Profile page compiles and shows the phone verification widget.

---

## Step 2 pass criteria

Test these manually in the browser:

```
[ ] Navigating to /login shows the phone input with 🇷🇸 +381 prefix
[ ] Entering a valid number (e.g. 064 123 4567) and clicking "Pošalji kod" — SMS arrives within 30s (requires Twilio configured)
[ ] Entering 6-digit code auto-submits when last digit is typed
[ ] Wrong code shows "Neispravan ili istekao kod" in red
[ ] "Nisam primio kod" link is greyed out for 60 seconds then becomes clickable
[ ] "← Promeni broj" goes back to the phone input
[ ] "Nastavi sa Google" button still signs in via Google OAuth
[ ] Profile page shows PhoneVerification widget with "Dodaj" button
[ ] After OTP verified in profile, phone number shows under the widget
[ ] npm run typecheck → 0 errors
```

**Next:** Open `PHASE4_STEP3_LISTING_MGMT.md`
