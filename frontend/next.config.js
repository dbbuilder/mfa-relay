/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['grglttyirzxfdpbyuxut.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig