import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // CSP frame-ancestors takes precedence over X-Frame-Options in all modern browsers
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://whop.com https://*.whop.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
