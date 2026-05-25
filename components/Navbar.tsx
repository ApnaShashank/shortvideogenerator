"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function Navbar() {
  const pathname = usePathname()
  
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">LyricsFlow AI</span>
        </Link>

        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm font-medium hover:text-primary">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary">
            Pricing
          </Link>
          <Link href="/templates" className="text-sm font-medium hover:text-primary">
            Templates
          </Link>
          <Link href="/docs" className="text-sm font-medium hover:text-primary">
            Docs
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
