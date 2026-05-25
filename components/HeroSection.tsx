import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Video } from 'lucide-react'
import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Video Generation</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Create & Schedule
            <span className="block text-primary">AI Short Videos</span>
            in Minutes
          </h1>
          
          <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            LyricsFlow AI is your all-in-one AI lyrics reel generator and scheduler for YouTube, 
            Instagram, TikTok, and Shorts. Automate your content creation with intelligent scheduling.
          </p>

          
          <div className="flex flex-col gap-4 sm:flex-row">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button size="lg" asChild>
                <Link href="/dashboard" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
            
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo" className="gap-2">
                <Video className="h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 rounded-2xl border bg-card p-2 shadow-lg">
            <div className="aspect-video w-full max-w-4xl rounded-lg bg-muted">
              {/* Dashboard preview placeholder */}
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Video Dashboard Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
