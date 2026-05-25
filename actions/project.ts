'use server'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { Project } from '@/lib/mongodb/models'
import { revalidatePath } from 'next/cache'

export async function deleteProject(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    const result = await Project.deleteOne({ _id: id, userId })

    if (result.deletedCount === 0) {
      return { success: false, error: 'Series not found or unauthorized' }
    }

    revalidatePath('/dashboard/series')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting project/series:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}

export async function getProjectById(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()
    const project = await Project.findOne({ _id: id, userId })
    
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    return { success: true, project: JSON.parse(JSON.stringify(project)) }
  } catch (error: any) {
    console.error('Error getting project:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
