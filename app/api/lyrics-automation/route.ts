import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User, VideoGeneration, CreditTransaction, Project, LyricsAutomation } from '@/lib/mongodb/models'
import { LYRICS_PRESETS, SongPreset } from '@/lib/video/lyrics-presets'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'
import crypto from 'crypto'
import { uploadToImageKit } from '@/lib/imagekit'

const execPromise = util.promisify(exec)

// GET user's automation settings
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    let settings = await LyricsAutomation.findOne({ userId })
    if (!settings) {
      settings = await LyricsAutomation.create({
        userId,
        isActive: false,
        selectedSongs: ['all'],
        textColor: '#ef4444',
        font: 'Caveat',
        backgroundGradient: 'chashma-lagwla'
      })
    }

    return NextResponse.json(JSON.parse(JSON.stringify(settings)), { status: 200 })
  } catch (error: any) {
    console.error('Error fetching lyrics settings:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

// POST user's automation settings or trigger automated generation
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, isActive, selectedSongs, textColor, font, backgroundGradient } = body

    await connectToDatabase()

    // Handle trigger action (Immediate Automation Run)
    if (action === 'trigger') {
      // 1. Fetch user to verify credits
      const user = await User.findOne({ userId })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.credits < 1) {
        return NextResponse.json({ error: 'Insufficient credits. Please upgrade or purchase more credits.' }, { status: 400 })
      }

      // Get automation settings to pick songs
      const settings = await LyricsAutomation.findOne({ userId })
      const songsToPickFrom = settings && settings.selectedSongs.length > 0 && settings.selectedSongs[0] !== 'all'
        ? settings.selectedSongs
        : LYRICS_PRESETS.map(s => s.id)

      if (songsToPickFrom.length === 0) {
        return NextResponse.json({ error: 'No songs selected for automation rotation.' }, { status: 400 })
      }

      // Pick a random song preset
      const randomSongId = songsToPickFrom[Math.floor(Math.random() * songsToPickFrom.length)]
      const preset = LYRICS_PRESETS.find(s => s.id === randomSongId) || LYRICS_PRESETS[0]

      // Deduct credit
      user.credits -= 1
      await user.save()

      // Log credit transaction
      await CreditTransaction.create({
        userId,
        type: 'usage',
        amount: -1,
        description: `Automated Lyrics Reel for song: ${preset.name}`
      })

      // Resolve Project
      let project = await Project.findOne({ userId, name: "Lyrics Reels" })
      if (!project) {
        project = await Project.create({
          userId,
          name: "Lyrics Reels",
          description: "Automated & custom lyrics short video series",
          brandColor: preset.textColor || "#ef4444",
          logoUrl: "",
          watermarkUrl: "",
          isActive: true
        })
      }

      // Create video generation document
      const generationId = new mongoose.Types.ObjectId()
      const newGeneration = await VideoGeneration.create({
        _id: generationId,
        userId,
        projectId: project._id,
        prompt: `Automated: ${preset.name}`,
        style: 'lyrics-card',
        duration: 15,
        aspectRatio: '9:16',
        status: 'processing',
        progress: 10,
        creditsUsed: 1,
      })

      // Background task execution (inline for direct control in this endpoint)
      const workspaceRoot = process.cwd()
      const tempDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'temp')
      const outputDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'rendered-videos')

      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

      const tempFontPath = path.join(tempDir, `font-${generationId}.ttf`)
      const tempLyricsPath = path.join(tempDir, `lyrics-${generationId}.txt`)
      const tempAudioPath = path.join(tempDir, `audio-${generationId}.mp3`)

      const videoFileName = `video-${generationId}.mp4`
      const thumbFileName = `thumb-${generationId}.jpg`
      const outputPath = path.join(outputDir, videoFileName)
      const thumbnailPath = path.join(outputDir, thumbFileName)

      try {
        const cacheDir = path.join(tempDir, 'cache')
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }

        // 1. Download Font (with caching)
        const fontUrl = preset.fontUrl || "https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bTCYB2I7M8Kp-A.ttf"
        const fontHash = crypto.createHash('md5').update(fontUrl).digest('hex')
        const cachedFontPath = path.join(cacheDir, `font-${fontHash}.ttf`)

        if (fs.existsSync(cachedFontPath)) {
          console.log(`[Automation] Loading font from cache: ${cachedFontPath}`)
          fs.copyFileSync(cachedFontPath, tempFontPath)
        } else {
          console.log(`[Automation] Downloading font from: ${fontUrl}`)
          const fontRes = await fetch(fontUrl)
          if (!fontRes.ok) throw new Error(`Font download failed: ${fontRes.statusText}`)
          const fontBuffer = await fontRes.arrayBuffer()
          fs.writeFileSync(cachedFontPath, Buffer.from(fontBuffer))
          fs.copyFileSync(cachedFontPath, tempFontPath)
        }

        // 2. Load/Download Audio (with caching/local path support)
        if (preset.audioUrl.startsWith('/')) {
          const localFilePath = path.join(workspaceRoot, 'public', preset.audioUrl)
          console.log(`[Automation] Loading preset audio from local path: ${localFilePath}`)
          if (!fs.existsSync(localFilePath)) {
            throw new Error(`Preset audio file not found locally: ${localFilePath}`)
          }
          fs.copyFileSync(localFilePath, tempAudioPath)
        } else {
          const audioHash = crypto.createHash('md5').update(preset.audioUrl).digest('hex')
          const cachedAudioPath = path.join(cacheDir, `audio-${audioHash}.mp3`)

          if (fs.existsSync(cachedAudioPath)) {
            console.log(`[Automation] Loading audio from cache: ${cachedAudioPath}`)
            fs.copyFileSync(cachedAudioPath, tempAudioPath)
          } else {
            console.log(`[Automation] Downloading audio from: ${preset.audioUrl}`)
            const audioRes = await fetch(preset.audioUrl)
            if (!audioRes.ok) throw new Error(`Audio download failed: ${audioRes.statusText}`)
            const audioBuffer = await audioRes.arrayBuffer()
            fs.writeFileSync(cachedAudioPath, Buffer.from(audioBuffer))
            fs.copyFileSync(cachedAudioPath, tempAudioPath)
          }
        }

        // 3. Write lyrics text to file (convert newlines to system native style)
        console.log(`[Automation] Writing lyrics to file`)
        fs.writeFileSync(tempLyricsPath, preset.lyrics)

        // 4. Escape paths for FFmpeg on Windows
        const escapedFont = tempFontPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        const escapedLyrics = tempLyricsPath.replace(/\\/g, '/').replace(/:/g, '\\:')
        const colorHex = preset.textColor.replace('#', '')

        // 5. Run FFmpeg command using native solid color and drawtext filter
        console.log(`[Automation] Compiling video via FFmpeg...`)
        const renderCmd = `ffmpeg -y -f lavfi -i "color=c=${preset.fromColor.replace('#', '')}:s=1080x1920" -i "${tempAudioPath}" -vf "drawtext=fontfile='${escapedFont}':textfile='${escapedLyrics}':fontcolor=${preset.textColor}:fontsize=60:line_spacing=20:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`
        await execPromise(renderCmd)

        // 6. Generate thumbnail
        const thumbCmd = `ffmpeg -y -i "${outputPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`
        try {
          await execPromise(thumbCmd)
        } catch (e) {
          console.warn('[Automation] Failed to generate thumbnail:', e)
        }

        // 7. Upload to ImageKit if keys are configured
        let returnedOutputUrl = `/rendered-videos/${videoFileName}`
        let returnedThumbnailUrl = fs.existsSync(thumbnailPath) 
          ? `/rendered-videos/${thumbFileName}` 
          : 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400'

        if (process.env.IMAGEKIT_PRIVATE_KEY) {
          try {
            console.log(`[Automation] Uploading rendered video to ImageKit...`)
            const videoBuffer = fs.readFileSync(outputPath)
            returnedOutputUrl = await uploadToImageKit(videoBuffer, videoFileName, '/rendered-videos')

            if (fs.existsSync(thumbnailPath)) {
              console.log(`[Automation] Uploading thumbnail to ImageKit...`)
              const thumbBuffer = fs.readFileSync(thumbnailPath)
              returnedThumbnailUrl = await uploadToImageKit(thumbBuffer, thumbFileName, '/rendered-videos')
            }
          } catch (uploadError) {
            console.error('[Automation] ImageKit upload failed:', uploadError)
          }
        }

        // Update VideoGeneration
        newGeneration.status = 'completed'
        newGeneration.progress = 100
        newGeneration.outputUrl = returnedOutputUrl
        newGeneration.thumbnailUrl = returnedThumbnailUrl
        newGeneration.completedAt = new Date()
        newGeneration.metadata = {
          songName: preset.name,
          lyrics: preset.lyrics,
          type: 'lyrics_reel',
          isAutomated: true,
          renderedSuccessfully: true
        }
        await newGeneration.save()

        console.log(`[Automation] Automated video generation success: ${newGeneration._id}`)
        return NextResponse.json({ success: true, video: JSON.parse(JSON.stringify(newGeneration)) }, { status: 201 })

      } catch (innerErr: any) {
        console.error('[Automation] Compilation failed:', innerErr)
        newGeneration.status = 'failed'
        newGeneration.errorMessage = innerErr.message || 'Automation rendering failed'
        newGeneration.progress = 0
        await newGeneration.save()
        throw innerErr;
      } finally {
        // Clean up temp files
        try {
          if (fs.existsSync(tempFontPath)) fs.unlinkSync(tempFontPath)
          if (fs.existsSync(tempLyricsPath)) fs.unlinkSync(tempLyricsPath)
          if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath)
          
          if (process.env.IMAGEKIT_PRIVATE_KEY) {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
          }
        } catch (e) {
          console.error('[Automation] Temp cleanup failed:', e)
        }
      }
    }

    // Otherwise, handle saving settings
    let settings = await LyricsAutomation.findOne({ userId })
    if (settings) {
      settings.isActive = isActive !== undefined ? isActive : settings.isActive
      settings.selectedSongs = selectedSongs || settings.selectedSongs
      settings.textColor = textColor || settings.textColor
      settings.font = font || settings.font
      settings.backgroundGradient = backgroundGradient || settings.backgroundGradient
      await settings.save()
    } else {
      settings = await LyricsAutomation.create({
        userId,
        isActive: !!isActive,
        selectedSongs: selectedSongs || ['all'],
        textColor: textColor || '#ef4444',
        font: font || 'Caveat',
        backgroundGradient: backgroundGradient || 'chashma-lagwla'
      })
    }

    return NextResponse.json(JSON.parse(JSON.stringify(settings)), { status: 200 })
  } catch (error: any) {
    console.error('Error saving/triggering lyrics automation:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
