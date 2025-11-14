// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name:string, value:string, options) { request.cookies.set({ name, value, ...options }); response = NextResponse.next({ request: { headers: request.headers } }) },
        remove(name: string, options) { request.cookies.set({ name, value: '', ...options }); response = NextResponse.next({ request: { headers: request.headers } }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // If the user is not logged in and is trying to access the dashboard, redirect them to the home page to log in.
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}