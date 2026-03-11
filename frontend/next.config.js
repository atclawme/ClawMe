/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Strict mode: errors will fail the build in production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
