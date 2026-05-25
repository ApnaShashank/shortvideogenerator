import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User, VideoGeneration, CreditTransaction, Project } from '@/lib/mongodb/models'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'
import crypto from 'crypto'
import ytdl from '@distube/ytdl-core'
import { uploadToImageKit } from '@/lib/imagekit'

const execPromise = util.promisify(exec)

export async function POST(req: NextRequest) {
  const generationId = new mongoose.Types.ObjectId()
  const workspaceRoot = process.cwd()
  const tempDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'temp')
  const outputDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'rendered-videos')

  const tempVideoPath = path.join(tempDir, `bg-${generationId}.png`)
  const tempAudioPath = path.join(tempDir, `audio-${generationId}.mp3`)
  const videoFileName = `video-${generationId}.mp4`
  const thumbFileName = `thumb-${generationId}.jpg`
  const outputPath = path.join(outputDir, videoFileName)
  const thumbnailPath = path.join(outputDir, thumbFileName)

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const backgroundImage = formData.get('backgroundImage') as string
    const audioUrl = formData.get('audioUrl') as string
    const songName = formData.get('songName') as string
    const lyrics = formData.get('lyrics') as string
    const audioFile = formData.get('audioFile') as File | null

    if (!backgroundImage) {
      return NextResponse.json({ error: 'Background image is required.' }, { status: 400 })
    }

    if (!audioFile && !audioUrl) {
      return NextResponse.json({ error: 'Audio file or audio URL is required.' }, { status: 400 })
    }

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
    await CreditTransaction.create({
      userId,
      type: 'usage',
      amount: -1,
      description: `Generated Lyrics Reel for song: ${songName || 'Custom Song'}`
    })

    // 4. Save/Update Series (Project) in MongoDB
    let project = await Project.findOne({ userId, name: "Lyrics Reels" })
    if (!project) {
      project = await Project.create({
        userId,
        name: "Lyrics Reels",
        description: "Automated & custom lyrics short video series",
        brandColor: "#ef4444",
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
      prompt: `Lyrics Reel: ${songName || 'Custom'}`,
      style: 'lyrics-card',
      duration: 15, // standard placeholder, updated below
      aspectRatio: '9:16',
      status: 'processing',
      progress: 20,
      creditsUsed: 1,
    })

    // Ensure temp and output directories exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 6. Save client canvas base64 image to temporary file
    console.log(`[Lyrics Render] Saving background image data URL to: ${tempVideoPath}`)
    const base64Data = backgroundImage.split(';base64,').pop()
    if (!base64Data) {
      throw new Error("Invalid background image base64 format")
    }
    fs.writeFileSync(tempVideoPath, Buffer.from(base64Data, 'base64'))

    // 7. Save audio track to temporary file (either from upload, local path, or URL with local caching)
    if (audioFile) {
      console.log(`[Lyrics Render] Saving uploaded audio file: ${audioFile.name} (${audioFile.size} bytes)`)
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      fs.writeFileSync(tempAudioPath, audioBuffer)
    } else if (audioUrl.startsWith('/')) {
      const localFilePath = path.join(workspaceRoot, 'public', audioUrl)
      console.log(`[Lyrics Render] Loading preset audio from local path: ${localFilePath}`)
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`Preset audio file not found locally: ${localFilePath}`)
      }
      fs.copyFileSync(localFilePath, tempAudioPath)
    } else {
      const isYouTube = audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be')
      const isOtherSocialMedia = audioUrl.includes('tiktok.com') || 
                            audioUrl.includes('instagram.com') ||
                            audioUrl.includes('soundcloud.com')

      const hash = crypto.createHash('md5').update(audioUrl).digest('hex')
      const cacheDir = path.join(tempDir, 'cache')
      const cachePath = path.join(cacheDir, `audio-${hash}.mp3`)

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      if (fs.existsSync(cachePath)) {
        console.log(`[Lyrics Render] Loading audio from local cache: ${cachePath}`)
        fs.copyFileSync(cachePath, tempAudioPath)
      } else if (isYouTube) {
        console.log(`[Lyrics Render] Downloading YouTube audio via @distube/ytdl-core: ${audioUrl}`)
        try {
          await new Promise((resolve, reject) => {
            const stream = ytdl(audioUrl, { filter: 'audioonly', quality: 'highestaudio', requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } } })
            const writeStream = fs.createWriteStream(cachePath)
            stream.pipe(writeStream)
            stream.on('end', resolve)
            stream.on('error', reject)
            writeStream.on('error', reject)
          })
          fs.copyFileSync(cachePath, tempAudioPath)
        } catch (err: any) {
          console.error(`[Lyrics Render] YouTube download failed via ytdl, trying RapidAPI YouTube MP3 converter:`, err)
          
          let downloaded = false
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
          const match = audioUrl.match(regExp)
          const ytId = (match && match[2].length === 11) ? match[2] : null

          if (ytId && process.env.RAPIDAPI_KEY) {
            try {
              console.log(`[Lyrics Render] Resolving YouTube audio via RapidAPI: ${ytId}`)
              const rapidResponse = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${ytId}`, {
                headers: {
                  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                  'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
                }
              })
              if (rapidResponse.ok) {
                const rapidData = await rapidResponse.json()
                if (rapidData.status === 'ok' && rapidData.link) {
                  console.log(`[Lyrics Render] Successfully resolved YouTube audio via RapidAPI: ${rapidData.link}`)
                  const audioResponse = await fetch(rapidData.link)
                  if (audioResponse.ok) {
                    const audioBuffer = await audioResponse.arrayBuffer()
                    fs.writeFileSync(cachePath, Buffer.from(audioBuffer))
                    fs.copyFileSync(cachePath, tempAudioPath)
                    downloaded = true
                  }
                }
              }
            } catch (rapidErr) {
              console.error(`[Lyrics Render] RapidAPI YouTube MP3 fallback failed:`, rapidErr)
            }
          }

          if (!downloaded) {
            console.log(`[Lyrics Render] RapidAPI fallback failed or skipped, trying Cobalt fallback:`)
            try {
              console.log(`[Lyrics Render] Resolving YouTube audio via Cobalt: ${audioUrl}`)
              const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  url: audioUrl,
                  isAudioOnly: true,
                  audioFormat: 'mp3'
                })
              })

              if (cobaltResponse.ok) {
                const cobaltData = await cobaltResponse.json()
                if (cobaltData.url) {
                  console.log(`[Lyrics Render] Successfully resolved YouTube audio via Cobalt: ${cobaltData.url}`)
                  const audioResponse = await fetch(cobaltData.url)
                  if (!audioResponse.ok) throw new Error(`Fetch audio from Cobalt stream failed: ${audioResponse.statusText}`)
                  const audioBuffer = await audioResponse.arrayBuffer()
                  fs.writeFileSync(cachePath, Buffer.from(audioBuffer))
                  fs.copyFileSync(cachePath, tempAudioPath)
                } else {
                  throw new Error("Cobalt did not return a valid audio stream URL.")
                }
              } else {
                throw new Error(`Cobalt returned status ${cobaltResponse.status}`)
              }
            } catch (cobaltErr: any) {
              console.error(`[Lyrics Render] Cobalt fallback also failed:`, cobaltErr)
              throw new Error(`Failed to download audio track. YouTube blocked direct connection (${err.message}), RapidAPI failed, and Cobalt download failed (${cobaltErr.message}).`)
            }
          }
        }

      } else {
        let resolvedUrl = audioUrl
        if (isOtherSocialMedia) {
          console.log(`[Lyrics Render] Resolving social media media URL via Cobalt: ${audioUrl}`)
          try {
            const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                url: audioUrl,
                isAudioOnly: true,
                audioFormat: 'mp3'
              })
            })

            if (cobaltResponse.ok) {
              const cobaltData = await cobaltResponse.json()
              if (cobaltData.status === 'stream' && cobaltData.url) {
                resolvedUrl = cobaltData.url
                console.log(`[Lyrics Render] Successfully resolved to stream URL: ${resolvedUrl}`)
              } else {
                throw new Error(cobaltData.text || "Cobalt API did not return a valid stream URL.")
              }
            } else {
              throw new Error(`Media downloader returned status code: ${cobaltResponse.status}`)
            }
          } catch (err: any) {
            console.error(`[Lyrics Render] Cobalt API resolution failed:`, err)
            throw new Error(`Failed to extract audio from social media link (${err.message || 'Service down'}). Please download the song as an MP3 file on your device and upload it using Option A.`)
          }
        }

        console.log(`[Lyrics Render] Downloading audio from: ${resolvedUrl}`)
        const audioResponse = await fetch(resolvedUrl)
        if (!audioResponse.ok) {
          if (audioResponse.status === 429) {
            throw new Error("The server was rate-limited by the audio host. Please download the MP3 file on your device and upload it using Option A (Upload local MP3 File).")
          }
          throw new Error(`Failed to download audio file: ${audioResponse.statusText}`)
        }

        const contentType = audioResponse.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          throw new Error("The provided link is a web page, not a direct MP3 file. Please download the MP3 file on your device and upload it using Option A (Upload local MP3 File).")
        }

        const audioBuffer = await audioResponse.arrayBuffer()
        fs.writeFileSync(cachePath, Buffer.from(audioBuffer))
        fs.copyFileSync(cachePath, tempAudioPath)
      }
    }

    // 8. Run FFmpeg command to loop background and output video
    console.log(`[Lyrics Render] Compiling video via FFmpeg...`)
    const renderCmd = `ffmpeg -y -loop 1 -i "${tempVideoPath}" -i "${tempAudioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`
    await execPromise(renderCmd)

    // 9. Generate thumbnail
    const thumbCmd = `ffmpeg -y -i "${outputPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`
    try {
      await execPromise(thumbCmd)
    } catch (e) {
      console.warn('[Lyrics Render] Failed to generate thumbnail:', e)
    }

    // 10. Upload to ImageKit if keys are configured
    let returnedOutputUrl = `/rendered-videos/${videoFileName}`
    let returnedThumbnailUrl = fs.existsSync(thumbnailPath) 
      ? `/rendered-videos/${thumbFileName}` 
      : 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400'

    if (process.env.IMAGEKIT_PRIVATE_KEY) {
      try {
        console.log(`[Lyrics Render] Uploading rendered video to ImageKit...`)
        const videoBuffer = fs.readFileSync(outputPath)
        returnedOutputUrl = await uploadToImageKit(videoBuffer, videoFileName, '/rendered-videos')

        if (fs.existsSync(thumbnailPath)) {
          console.log(`[Lyrics Render] Uploading thumbnail to ImageKit...`)
          const thumbBuffer = fs.readFileSync(thumbnailPath)
          returnedThumbnailUrl = await uploadToImageKit(thumbBuffer, thumbFileName, '/rendered-videos')
        }
      } catch (uploadError) {
        console.error('[Lyrics Render] ImageKit upload failed:', uploadError)
      }
    }

    newGeneration.status = 'completed'
    newGeneration.progress = 100
    newGeneration.outputUrl = returnedOutputUrl
    newGeneration.thumbnailUrl = returnedThumbnailUrl
    newGeneration.completedAt = new Date()
    newGeneration.metadata = {
      songName,
      lyrics,
      type: 'lyrics_reel',
      renderedSuccessfully: true
    }
    await newGeneration.save()

    console.log(`[Lyrics Render] Render completed for videoId=${newGeneration._id}`)
    return NextResponse.json(JSON.parse(JSON.stringify(newGeneration)), { status: 201 })

  } catch (error: any) {
    console.error('[Lyrics Render] Render failed:', error)
    
    // Update VideoGeneration document to failed
    try {
      await connectToDatabase()
      await VideoGeneration.findByIdAndUpdate(generationId, {
        status: 'failed',
        errorMessage: error.message || 'An unexpected error occurred during lyrics reel rendering.',
        progress: 0
      })
    } catch (dbErr) {
      console.error('[Lyrics Render] Failed to save error status:', dbErr)
    }

    return NextResponse.json({ error: error.message || 'Server error occurred during rendering.' }, { status: 500 })
  } finally {
    // Cleanup temporary files
    console.log('[Lyrics Render] Cleaning up temp files')
    try {
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath)
      if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath)
      
      // Clean up final output and thumbnail files locally if we uploaded them to ImageKit
      if (process.env.IMAGEKIT_PRIVATE_KEY) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
      }
    } catch (e) {
      console.error('[Lyrics Render] Cleanup error:', e)
    }
  }
}
