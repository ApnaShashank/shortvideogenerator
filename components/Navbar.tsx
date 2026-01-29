import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">VidMaxx</span>
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
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
