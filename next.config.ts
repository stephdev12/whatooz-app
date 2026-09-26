import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel deployment: standalone output for optimal cold starts
  output: 'standalone',

  // Strict React mode for catching issues early
  reactStrictMode: true,

  // Fix: Tell Turbopack that *this* directory is the workspace root,
  // not the parent whatooz/ folder (which has its own package-lock.json).
  turbopack: {
    root: import.meta.dirname,
  },

  // WhatsApp media images from Meta CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.whatsapp.net',
      },
    ],
  },
}

export default nextConfig
