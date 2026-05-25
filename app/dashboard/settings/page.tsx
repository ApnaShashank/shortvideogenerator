import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { Project } from '@/lib/mongodb/models'
import { SettingsDashboard } from './SettingsDashboard'
import { getPlatformConnections } from '@/actions/connections'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-bold">Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Please sign in to view settings.</p>
      </div>
    )
  }

  try {
    await connectToDatabase()

    const project = await Project.findOne({ userId })
    const connections = await getPlatformConnections()

    const initialSettings = project 
      ? {
          name: project.name,
          description: project.description || "",
          brandColor: project.brandColor || "#3b82f6",
          logoUrl: project.logoUrl || "",
          watermarkUrl: project.watermarkUrl || ""
        }
      : undefined

    return (
      <div className="container mx-auto py-6">
        <SettingsDashboard 
          initialSettings={initialSettings} 
          initialConnections={connections}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading settings page:', error)
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <h2 className="text-xl font-bold">Failed to load configurations</h2>
        <p className="text-muted-foreground mt-2">There was an error communicating with the database. Please try again.</p>
      </div>
    )
  }
}
