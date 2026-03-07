import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Static research assets — cache them and allow any origin to fetch
      {
        source: '/research/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // Single CSP — no /:path* wildcard rule to conflict with this
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; img-src 'self' data: https:; frame-ancestors *",
          },
        ],
      },
      // Experiences route — must be embeddable inside Whop's iframe
      {
        source: '/experiences/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
