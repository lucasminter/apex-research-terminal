import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve the research hub directly at the Whop experiences URL.
  // Using a server-side rewrite (not redirect) keeps the URL at
  // /experiences/[id] so Whop's desktop iframe tracking stays intact.
  // The HTML has <base href="/research/"> so all relative asset URLs resolve correctly.
  if (pathname.startsWith('/experiences/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/research/index.html';
    const response = NextResponse.rewrite(url);
    response.headers.set('Content-Security-Policy', "frame-ancestors *");
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    return response;
  }
}

export const config = {
  matcher: '/experiences/:path*',
};
