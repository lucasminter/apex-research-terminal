import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const IFRAME_HEADERS = {
  'Content-Security-Policy': "frame-ancestors *",
  'X-Frame-Options': 'ALLOWALL',
};

function rewriteToHub(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/research/index.html';
  const response = NextResponse.rewrite(url);
  Object.entries(IFRAME_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite all Whop entry points to the research hub.
  // /experiences/[id] — standard Whop iframe load
  // / and /research   — root / short URL (used by Whop app store reviewer)
  if (
    pathname.startsWith('/experiences/') ||
    pathname === '/' ||
    pathname === '/research'
  ) {
    return rewriteToHub(request);
  }
}

export const config = {
  matcher: ['/', '/research', '/experiences/:path*'],
};
