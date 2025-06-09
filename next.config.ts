import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false
      }
    ]
  },
  experimental: {
    forceSwcTransforms: true, // ✅ Forces SWC even if Babel is present
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ticketweb.com',
        port: '',
        pathname: '/**',
      },
      // add other domains as needed
    ],
  },
};

export default nextConfig;