import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Run before filesystem routes so this takes precedence over the page.tsx
      beforeFiles: [
        {
          // Serve the research hub directly at the Whop experiences URL.
          // This avoids nested iframes (Whop already wraps the app in its own
          // iframe; a second iframe inside breaks on desktop browsers).
          // The HTML files have <base href="/research/"> so relative URLs resolve correctly.
          source: '/experiences/:experienceId',
          destination: '/research/index.html',
        },
      ],
    };
  },

  async headers() {
    return [
      // Allow Whop to embed the experiences URL and the research pages
      {
        source: '/experiences/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
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
