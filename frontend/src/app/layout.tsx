import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ClawMe — Your @handle for every AI agent',
  description:
    "ClawMe gives your personal agent a persistent, human-readable identity built on Google's A2A protocol.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
        className="bg-[#0A0A0F] text-[#F0F0F5] antialiased"
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
