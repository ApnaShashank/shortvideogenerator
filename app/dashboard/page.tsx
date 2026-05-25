import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User, VideoGeneration } from '@/lib/mongodb/models'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Video, 
  Music, 
  Settings, 
  Clock, 
  ArrowRight, 
  Cpu, 
  CheckCircle,
  Play
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()
  
  if (!userId || !clerkUser) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view your dashboard.</p>
      </div>
    )
  }

  await connectToDatabase()

  // 1. Fetch user credits
  let mongoUser = await User.findOne({ userId })
  if (!mongoUser) {
    // Fallback sync if user doesn't exist yet
    mongoUser = await User.create({
      userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      credits: 100
    })
  }

  // 2. Fetch latest 3 video generations
  const recentVideosRaw = await VideoGeneration.find({ userId })
    .sort({ createdAt: -1 })
    .limit(3)
  const recentVideos = JSON.parse(JSON.stringify(recentVideosRaw))

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {clerkUser.firstName || 'Creator'}</h1>
          <p className="text-muted-foreground text-sm">Here is a quick overview of your AI content creation workspace.</p>
        </div>
        <Link href="/dashboard/lyrics">
          <Button className="gap-2 shadow bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 font-semibold">
            <Sparkles className="h-4 w-4" /> Create Lyrics Reel
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border shadow-sm bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Credits Available</CardDescription>
            <CardTitle className="text-4xl font-extrabold text-primary">{mongoUser.credits}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-muted-foreground">
            1 credit is used per video generation. Credits reset monthly.
          </CardContent>
          <CardFooter className="pt-0 border-t mt-4 flex justify-between items-center text-xs">
            <span>Tier: <span className="font-bold capitalize text-foreground">{mongoUser.subscriptionTier || 'free'}</span></span>
            <Link href="/dashboard/billing" className="text-primary hover:underline flex items-center gap-0.5 font-semibold">
              Buy more <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Generations</CardDescription>
            <CardTitle className="text-4xl font-extrabold">
              {await VideoGeneration.countDocuments({ userId })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-muted-foreground">
            Across both automated reels and custom video series.
          </CardContent>
          <CardFooter className="pt-0 border-t mt-4 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Active Series</span>
            <Link href="/dashboard/series" className="text-primary hover:underline flex items-center gap-0.5 font-semibold">
              Manage series <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Connected Accounts</CardDescription>
            <CardTitle className="text-4xl font-extrabold">
              {mongoUser.subscriptionTier === 'business' ? 'Active' : '1'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-muted-foreground">
            Social integration for automated scheduled auto-posting.
          </CardContent>
          <CardFooter className="pt-0 border-t mt-4 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Instagram / YouTube</span>
            <Link href="/dashboard/settings" className="text-primary hover:underline flex items-center gap-0.5 font-semibold">
              Integrations <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Main Grid: Studio Selection & Recent Generations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Action studios */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-lg font-bold tracking-tight">AI Generation Studios</h2>
          
          <div className="space-y-4">
            <Card className="border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Music className="h-24 w-24 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2 font-bold">
                  <Music className="h-5 w-5 text-primary" /> AI Lyrics Studio
                </CardTitle>
                <CardDescription className="text-xs">
                  Create aesthetic animated lyrics videos from trending songs.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 text-xs text-muted-foreground">
                Automatic lyrics extraction, mood layout selection, and YouTube audio sync.
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-end">
                <Link href="/dashboard/lyrics">
                  <Button size="sm" variant="ghost" className="text-xs font-semibold hover:text-primary gap-1 group-hover:translate-x-0.5 transition-transform">
                    Enter Studio <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Video className="h-24 w-24 text-purple-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2 font-bold">
                  <Video className="h-5 w-5 text-purple-600" /> AI Video Studio
                </CardTitle>
                <CardDescription className="text-xs">
                  Generate narrative shorts based on AI scripts & voiceovers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 text-xs text-muted-foreground">
                Enter a custom prompt or topic, select a voice, and watch AI build it.
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-end">
                <Link href="/dashboard/create">
                  <Button size="sm" variant="ghost" className="text-xs font-semibold hover:text-purple-600 gap-1 group-hover:translate-x-0.5 transition-transform">
                    Enter Studio <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Recent Generations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight">Recent Generations</h2>
            <Link href="/dashboard/videos">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                View Gallery
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentVideos.length === 0 ? (
              <Card className="py-12 border-dashed text-center flex flex-col items-center justify-center bg-muted/10">
                <Video className="h-8 w-8 text-muted-foreground mb-2" />
                <CardTitle className="text-sm font-semibold">No video history found</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Start creating today in either the Lyrics or Video Studio!
                </CardDescription>
                <Link href="/dashboard/lyrics" className="mt-4">
                  <Button size="sm" className="text-xs font-semibold">
                    Generate First Video
                  </Button>
                </Link>
              </Card>
            ) : (
              recentVideos.map((video: any) => {
                const isCompleted = video.status === 'completed'
                const isFailed = video.status === 'failed'
                const isProcessing = video.status === 'pending' || video.status === 'processing'
                
                return (
                  <div 
                    key={video._id}
                    className="flex items-center gap-4 p-3 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors shadow-xs"
                  >
                    {/* Aspect aspect-video block */}
                    <div className="h-14 w-20 bg-muted rounded-lg overflow-hidden relative shrink-0">
                      <img 
                        src={video.thumbnailUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=200"} 
                        alt="video thumbnail" 
                        className="h-full w-full object-cover"
                      />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate uppercase tracking-wide" title={video.prompt}>
                        {video.prompt}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(video.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{video.style}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-semibold">
                          Completed
                        </Badge>
                      )}
                      {isFailed && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold">
                          Failed
                        </Badge>
                      )}
                      {isProcessing && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold animate-pulse">
                          Generating
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
