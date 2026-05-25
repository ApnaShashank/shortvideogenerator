'use server'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User, CreditTransaction } from '@/lib/mongodb/models'
import { revalidatePath } from 'next/cache'

export async function addCreditsMock(amount: number, description: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    const user = await User.findOne({ userId })
    if (!user) {
      throw new Error('User not found')
    }

    user.credits = (user.credits || 0) + amount
    await user.save()

    await CreditTransaction.create({
      userId,
      type: 'purchase',
      amount,
      description
    })

    revalidatePath('/dashboard/billing')
    return { success: true, newCredits: user.credits }
  } catch (error: any) {
    console.error('Error adding credits:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}

export async function upgradeSubscriptionMock(tier: 'free' | 'pro' | 'business') {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    const user = await User.findOne({ userId })
    if (!user) {
      throw new Error('User not found')
    }

    user.subscriptionTier = tier
    user.subscriptionStatus = 'active'
    user.subscriptionCurrentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    // Upgrade bonuses
    let bonusCredits = 0
    if (tier === 'pro') {
      bonusCredits = 500
    } else if (tier === 'business') {
      bonusCredits = 2000
    }

    user.credits = (user.credits || 0) + bonusCredits
    await user.save()

    await CreditTransaction.create({
      userId,
      type: 'bonus',
      amount: bonusCredits,
      description: `Upgraded subscription to ${tier.toUpperCase()} tier.`
    })

    revalidatePath('/dashboard/billing')
    return { success: true, newCredits: user.credits, tier }
  } catch (error: any) {
    console.error('Error upgrading subscription:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
