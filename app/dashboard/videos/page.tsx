import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { VideoGeneration } from '@/lib/mongodb/models'
import { VideoGallery } from './VideoGallery'

export const dynamic = 'force-dynamic'

export default async function VideosPage() {
  const { userId } = await auth()
  
  if (!userId) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view your video history.</p>
      </div>
    )
  }

  try {
    await connectToDatabase()

    // Fetch video generations for this user sorted by newest first
    const rawVideos = await VideoGeneration.find({ userId }).sort({ createdAt: -1 })

    // Serialize MongoDB models to plain JS objects for Server Component rendering
    const videos = JSON.parse(JSON.stringify(rawVideos))

    return (
      <div className="container mx-auto py-6">
        <VideoGallery videos={videos} />
      </div>
    )
  } catch (error) {
    console.error('Error loading video history:', error)
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <h2 className="text-xl font-bold">Failed to load videos</h2>
        <p className="text-muted-foreground mt-2">There was an error communicating with the database. Please try again later.</p>
      </div>
    )
  }
}
