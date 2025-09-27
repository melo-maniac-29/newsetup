/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  },
}

module.exports = nextConfig