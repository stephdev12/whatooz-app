import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Vercel deployment: standalone output for optimal cold starts
  output: 'standalone',

  // Strict React mode for catching issues early
  reactStrictMode: true,

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
