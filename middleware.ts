import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a logged-in user
const PROTECTED_ROUTES = new Set(['/new', '/favorites', '/messages', '/search-profiles', '/profile', '/register'])

function isProtected(pathname: string): boolean {
    if (PROTECTED_ROUTES.has(pathname)) return true
    // sub-paths of protected routes
    if (pathname.startsWith('/new/') || pathname.startsWith('/messages/') || pathname.startsWith('/favorites/')) return true
    return false
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Write refreshed tokens back into the request for downstream handlers
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    // Write refreshed tokens into the response so the browser stores them
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // getUser() refreshes the access token automatically when expired,
    // using the refresh token in cookies. Never use getSession() here —
    // it does not refresh and can serve stale/expired tokens.
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect unauthenticated users away from protected pages
    if (!user && isProtected(request.nextUrl.pathname)) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Run on all routes except Next.js internals and static files
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
