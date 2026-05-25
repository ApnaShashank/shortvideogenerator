import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'LyricsFlow AI - AI Lyrics Reel Generator',
  description: 'Create & Schedule AI Lyrics Reels in Minutes. Automate your content creation for YouTube, Instagram, TikTok, and Shorts.',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClerkProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  )
}
