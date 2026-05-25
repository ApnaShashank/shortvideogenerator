'use server'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { VideoGeneration } from '@/lib/mongodb/models'
import { revalidatePath } from 'next/cache'

export async function deleteVideoGeneration(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    const result = await VideoGeneration.deleteOne({ _id: id, userId })

    if (result.deletedCount === 0) {
      return { success: false, error: 'Video not found or unauthorized' }
    }

    revalidatePath('/dashboard/videos')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting video:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
