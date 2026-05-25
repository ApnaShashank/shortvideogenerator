import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { Project } from '@/lib/mongodb/models'
import { SeriesList } from './SeriesList'

export const dynamic = 'force-dynamic'

export default async function SeriesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view your series.</p>
      </div>
    )
  }

  try {
    await connectToDatabase()

    // Fetch active series/projects for this user sorted by newest first
    const rawProjects = await Project.find({ userId }).sort({ createdAt: -1 })

    // Serialize MongoDB models to plain JS objects
    const series = JSON.parse(JSON.stringify(rawProjects))

    return (
      <div className="container mx-auto py-6">
        <SeriesList series={series} />
      </div>
    )
  } catch (error) {
    console.error('Error loading series history:', error)
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <h2 className="text-xl font-bold">Failed to load series</h2>
        <p className="text-muted-foreground mt-2">There was an error communicating with the database. Please try again later.</p>
      </div>
    )
  }
}
