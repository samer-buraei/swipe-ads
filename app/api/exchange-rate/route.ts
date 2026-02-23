import { NextResponse } from 'next/server'

// Cache the rate for 24 hours using Next.js built-in fetch caching
export const revalidate = 86400 // 24 hours in seconds

export async function GET() {
    try {
        const response = await fetch(
            'https://api.frankfurter.app/latest?from=EUR&to=RSD',
            { next: { revalidate: 86400 } }
        )
        const data = await response.json()
        const rate = data.rates?.RSD ?? 117.5 // fallback rate

        return NextResponse.json({
            rate,
            updatedAt: new Date().toISOString(),
        })
    } catch {
        // Always return a fallback so the app never breaks
        return NextResponse.json({
            rate: 117.5,
            updatedAt: new Date().toISOString(),
            cached: true,
        })
    }
}
