import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Override Next.js default X-Frame-Options for all routes so the app
      // can be embedded in Whop's desktop iframe.
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      // Static research assets
      {
        source: '/research/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; img-src 'self' data: https:; frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
