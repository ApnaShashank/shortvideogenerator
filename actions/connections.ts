'use server'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { PlatformConnection } from '@/lib/mongodb/models'
import { revalidatePath } from 'next/cache'

export async function getPlatformConnections() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return []
    }

    await connectToDatabase()
    const connections = await PlatformConnection.find({ userId, isActive: true })
    return JSON.parse(JSON.stringify(connections))
  } catch (error) {
    console.error('Error fetching platform connections:', error)
    return []
  }
}

export async function connectPlatformMock(platform: 'youtube' | 'instagram' | 'tiktok' | 'email', channelName: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    // Mock OAuth token values
    const accessToken = `mock_access_token_${Math.random().toString(36).substring(7)}`
    const refreshToken = `mock_refresh_token_${Math.random().toString(36).substring(7)}`
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour expiry
    const platformUserId = `mock_user_id_${Math.random().toString(36).substring(7)}`
    const profilePicture = platform === 'youtube'
      ? 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=100'
      : 'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?q=80&w=100'

    const connection = await PlatformConnection.findOneAndUpdate(
      { userId, platform },
      {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        platformUserId,
        platformUserName: channelName,
        profilePicture,
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    revalidatePath('/dashboard/settings')
    return { success: true, connection: JSON.parse(JSON.stringify(connection)) }
  } catch (error: any) {
    console.error('Error connecting platform:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}

export async function disconnectPlatformMock(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    const result = await PlatformConnection.deleteOne({ _id: id, userId })
    
    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error disconnecting platform:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
