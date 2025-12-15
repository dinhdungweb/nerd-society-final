import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        if (req.nextUrl.pathname.startsWith('/admin')) {
            if (req.nextauth.token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/', req.url))
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    // Note: /booking removed to allow guest booking - API handles customer info
    matcher: ['/admin/:path*', '/profile/:path*'],
}

