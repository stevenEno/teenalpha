import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/payments/webhook') ||
    pathname.startsWith('/api/analytics/track') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if we have Supabase env vars - if not, don't try to create client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth/callback',
    '/forgot-password',
    // Landing page variants for A/B testing
    '/screen-time',
    '/grow',
    '/leapfrog',
    '/purpose',
    '/craft',
  ];

  const isPublicRoute =
    pathname === '/' ||
    publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Auth pages that logged-in users should be redirected away from
  const authPages = ['/', '/login', '/signup', '/forgot-password'];
  const isAuthPage = authPages.includes(pathname);

  // Try to get the user - wrap in try/catch to handle any errors gracefully
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (error) {
    // If there's an error getting the user, treat as not authenticated
    // This prevents redirect loops when cookies are in a bad state
    console.error('Error getting user in middleware:', error);
  }

  // PROTECTION: Check for redirect loop by looking at referer
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererPath = refererUrl.pathname;

      // If we're about to redirect from login to dashboard or vice versa,
      // and we just came from the opposite page, don't redirect (break the loop)
      if (
        (pathname === '/login' && refererPath === '/dashboard') ||
        (pathname === '/dashboard' && refererPath === '/login')
      ) {
        // We're in a potential loop - just let the page render
        return response;
      }
    } catch {
      // Invalid referer URL, ignore
    }
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    // Don't add redirectTo if we're already trying to go to login
    if (pathname === '/login') {
      return response;
    }
    const redirectUrl = new URL('/login', request.url);
    // Only add redirectTo for non-dashboard paths to avoid loops
    if (pathname !== '/dashboard') {
      redirectUrl.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (user && isAuthPage) {
    // Don't redirect if we just came from dashboard (prevents loop)
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};