/** @type {import('next').NextConfig} */
const allowVercelLive =
  process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'

const nextConfig = {
  reactStrictMode: true,
  // Strict mode: errors will fail the build in production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://nqximhfimxinetmzcetj.supabase.co${allowVercelLive ? ' https://vercel.live' : ''}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://nqximhfimxinetmzcetj.supabase.co https://*.googleusercontent.com https://avatars.githubusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://nqximhfimxinetmzcetj.supabase.co wss://nqximhfimxinetmzcetj.supabase.co${allowVercelLive ? ' https://vercel.live' : ''}; frame-ancestors 'none';`,
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
