import React from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User } from '@/lib/mongodb/models'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User as UserIcon, 
  Mail, 
  Coins, 
  Award, 
  ShieldCheck, 
  Calendar 
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view your profile.</p>
      </div>
    )
  }

  try {
    await connectToDatabase()

    const dbUser = await User.findOne({ userId: clerkUser.id })

    const credits = dbUser?.credits ?? 0
    const tier = dbUser?.subscriptionTier ?? 'free'
    const status = dbUser?.subscriptionStatus ?? 'trialing'

    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/10 border-b pb-6 flex flex-col md:flex-row items-center gap-4">
            <img 
              src={clerkUser.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} 
              alt={clerkUser.firstName || "User"} 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
            />
            <div className="text-center md:text-left space-y-1">
              <CardTitle className="text-2xl font-bold">
                {`${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "Profile"}
              </CardTitle>
              <CardDescription className="flex items-center justify-center md:justify-start gap-1">
                <Mail className="h-3 w-3" /> {clerkUser.emailAddresses[0].emailAddress}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Account Tier */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg mt-0.5">
                  <Award className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Account Tier</h4>
                  <p className="text-lg font-bold capitalize flex items-center gap-2">
                    {tier} Plan
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {status}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* High-speed Credits */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg mt-0.5">
                  <Coins className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Rendering Credits</h4>
                  <p className="text-lg font-bold text-amber-600">
                    {credits} Credits
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile specifications info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Security & Account Details
              </h3>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between py-1 border-b border-muted/50">
                  <span>User Unique Identifier (Clerk ID)</span>
                  <span className="font-mono text-[10px] text-foreground select-all">{clerkUser.id}</span>
                </div>
                
                <div className="flex justify-between py-1 border-b border-muted/50">
                  <span>Joined Date</span>
                  <span className="text-foreground">
                    {new Date(clerkUser.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span>Authentication Provider</span>
                  <span className="text-foreground capitalize">Clerk Authentication Service</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error loading profile page:', error)
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <h2 className="text-xl font-bold">Failed to load profile details</h2>
        <p className="text-muted-foreground mt-2">There was an error communicating with database. Please try again.</p>
      </div>
    )
  }
}
