import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User, VideoGeneration, CreditTransaction, Project } from '@/lib/mongodb/models'
import mongoose from 'mongoose'
import { inngest } from '@/lib/inngest/client'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const generationId = new mongoose.Types.ObjectId()

    const body = await req.json()
    const { 
      niche, 
      customNiche, 
      captionColor, 
      prompt, 
      videoStyle, 
      aspectRatio 
    } = body

    await connectToDatabase()

    // 1. Fetch user to verify credits
    const user = await User.findOne({ userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits. Please upgrade or purchase more credits.' }, { status: 400 })
    }

    // 2. Deduct credit
    user.credits -= 1
    await user.save()

    // 3. Log credit transaction
    const finalNiche = niche || customNiche || "General"
    await CreditTransaction.create({
      userId,
      type: 'usage',
      amount: -1,
      description: `Generated short video for niche: ${finalNiche}`
    })

    // 4. Save/Update Series (Project) in MongoDB
    let project = await Project.findOne({ userId, name: finalNiche })
    if (!project) {
      project = await Project.create({
        userId,
        name: finalNiche,
        description: `Automated short video series for: ${finalNiche}`,
        brandColor: captionColor || "#3b82f6",
        logoUrl: "",
        watermarkUrl: "",
        isActive: true
      })
    }

    // 5. Create VideoGeneration in DB with 'pending' status
    const newGeneration = await VideoGeneration.create({
      _id: generationId,
      userId,
      projectId: project._id,
      prompt: prompt || `AI generated short video for ${finalNiche}`,
      style: videoStyle,
      duration: 15, // Initial estimation, updated on completion
      aspectRatio,
      status: 'pending',
      progress: 5,
      creditsUsed: 1,
    })

    // 6. Trigger Inngest background event
    await inngest.send({
      name: "video.generate",
      data: {
        generationId: generationId.toString(),
        body
      }
    })

    console.log(`[Generate] Triggered Inngest background job: videoId=${newGeneration._id}`)

    return NextResponse.json(JSON.parse(JSON.stringify(newGeneration)), { status: 201 })
  } catch (error: any) {
    console.error('Error generating video:', error)
    return NextResponse.json({ error: error.message || 'Server error occurred during video generation.' }, { status: 500 })
  }
}
