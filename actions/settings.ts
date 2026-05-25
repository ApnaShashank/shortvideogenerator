'use server'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { Project } from '@/lib/mongodb/models'
import { revalidatePath } from 'next/cache'

export async function saveProjectSettings(formData: {
  name: string
  description: string
  brandColor: string
  logoUrl: string
  watermarkUrl: string
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await connectToDatabase()

    let project = await Project.findOne({ userId })

    if (project) {
      project.name = formData.name
      project.description = formData.description
      project.brandColor = formData.brandColor
      project.logoUrl = formData.logoUrl
      project.watermarkUrl = formData.watermarkUrl
      await project.save()
    } else {
      project = await Project.create({
        userId,
        name: formData.name,
        description: formData.description,
        brandColor: formData.brandColor,
        logoUrl: formData.logoUrl,
        watermarkUrl: formData.watermarkUrl,
        isActive: true
      })
    }

    revalidatePath('/dashboard/settings')
    return { success: true, project: JSON.parse(JSON.stringify(project)) }
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
