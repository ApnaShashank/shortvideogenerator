import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User } from '@/lib/mongodb/models'
import { BillingDashboard } from './BillingDashboard'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view your billing status.</p>
      </div>
    )
  }

  try {
    await connectToDatabase()

    let user = await User.findOne({ userId })

    if (!user) {
      return (
        <div className="container mx-auto py-10 text-center">
          <h2 className="text-xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground mt-2">There was an issue syncing your user profile. Please try refreshing.</p>
        </div>
      )
    }

    return (
      <div className="container mx-auto py-6">
        <BillingDashboard 
          initialCredits={user.credits || 0}
          initialTier={user.subscriptionTier || 'free'}
          initialStatus={user.subscriptionStatus || 'trialing'}
          initialPeriodEnd={user.subscriptionCurrentPeriodEnd?.toISOString()}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading billing page:', error)
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <h2 className="text-xl font-bold">Failed to load billing details</h2>
        <p className="text-muted-foreground mt-2">There was an error loading your billing information. Please try again.</p>
      </div>
    )
  }
}
