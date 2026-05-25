'use server'

import { currentUser } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User } from '@/lib/mongodb/models'

export async function syncUser() {
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  const userId = user.id

  try {
    await connectToDatabase()

    let existingUser = await User.findOne({ userId })

    if (existingUser) {
      // Serialize mongoose document to plain object for React Server Components compatibility
      return JSON.parse(JSON.stringify(existingUser))
    }

    const newUser = await User.create({
      userId,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      credits: 100,
      avatarUrl: user.imageUrl || ''
    })

    return JSON.parse(JSON.stringify(newUser))
  } catch (error) {
    console.error('Error syncing user to MongoDB:', error)
    return null
  }
}
