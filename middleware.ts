import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = new Set([
    '/new', '/favorites', '/messages', '/search-profiles', '/profile', '/register'
])

function isProtected(pathname: string): boolean {
    if (PROTECTED_ROUTES.has(pathname)) return true
    if (pathname.startsWith('/new/') || pathname.startsWith('/messages/') || pathname.startsWith('/favorites/')) return true
    return false
}

export function middleware(request: NextRequest) {
    if (!isProtected(request.nextUrl.pathname)) {
        return NextResponse.next()
    }

    // Check for any Supabase auth cookie (base token or chunked .0 / .1)
    const cookieBase = `sb-awbtohtpjrqlxfoqtita-auth-token`
    const hasSession =
        request.cookies.has(cookieBase) ||
        request.cookies.has(`${cookieBase}.0`) ||
        request.cookies.has(`${cookieBase}.1`)

    if (!hasSession) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
