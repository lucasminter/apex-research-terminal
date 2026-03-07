import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Static research assets — middleware handles /experiences/* headers
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
