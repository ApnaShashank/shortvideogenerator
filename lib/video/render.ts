import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'
import { uploadToImageKit } from '@/lib/imagekit'

const execPromise = util.promisify(exec)

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0')
  return `${h}:${m}:${s},${ms}`
}

function convertToSRT(segments: any[]): string {
  if (!segments || !segments.length) return ''
  return segments.map((seg, i) => {
    const start = formatSRTTime(seg.start)
    const end = formatSRTTime(seg.end)
    return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`
  }).join('\n')
}

function hexToAssColor(hex: string): string {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return '&H00FFFFFF' // White fallback
  const r = cleanHex.substring(0, 2)
  const g = cleanHex.substring(2, 4)
  const b = cleanHex.substring(4, 6)
  return `&H00${b}${g}${r}` // BGR format for ASS/force_style
}

interface RenderOptions {
  aspectRatio: '9:16' | '16:9' | '1:1'
  captionFont?: string
  captionColor?: string
  captionStyle?: string
}

export async function renderVideoLocal(
  generationId: string,
  bgVideoUrl: string,
  audioBase64: string,
  captionSegments: any[],
  options: RenderOptions
): Promise<{ outputUrl: string; thumbnailUrl: string }> {
  const workspaceRoot = process.cwd()
  const tempDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'temp')
  const outputDir = process.env.VERCEL ? '/tmp' : path.join(workspaceRoot, 'public', 'rendered-videos')

  // 1. Ensure directories exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const isImage = bgVideoUrl.match(/\.(webp|png|jpg|jpeg|gif)/i) || bgVideoUrl.includes('replicate.delivery')
  const bgExt = isImage ? 'webp' : 'mp4'
  const tempVideoPath = path.join(tempDir, `bg-${generationId}.${bgExt}`)
  const tempAudioPath = path.join(tempDir, `audio-${generationId}.mp3`)
  const tempSrtPath = path.join(tempDir, `subs-${generationId}.srt`)
  
  const videoFileName = `video-${generationId}.mp4`
  const thumbFileName = `thumb-${generationId}.jpg`
  const outputPath = path.join(outputDir, videoFileName)
  const thumbnailPath = path.join(outputDir, thumbFileName)

  try {
    // 2. Download background video
    console.log(`[Render] Downloading background video from: ${bgVideoUrl}`)
    const response = await fetch(bgVideoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download background video: ${response.statusText}`)
    }
    const bgBuffer = await response.arrayBuffer()
    fs.writeFileSync(tempVideoPath, Buffer.from(bgBuffer))

    // 3. Save audio narration
    console.log('[Render] Saving audio narration file')
    fs.writeFileSync(tempAudioPath, Buffer.from(audioBase64, 'base64'))

    // 4. Create subtitle file
    console.log('[Render] Writing SRT subtitles file')
    const srtContent = convertToSRT(captionSegments)
    fs.writeFileSync(tempSrtPath, srtContent)

    // 5. Build FFmpeg command with cropping and subtitles
    const escapedSrtPath = tempSrtPath.replace(/\\/g, '/').replace(/:/g, '\\:')
    const fontName = options.captionFont || 'Impact'
    const assColor = hexToAssColor(options.captionColor || '#eab308')
    
    // Construct filter chain
    let filterChain = ''
    if (options.aspectRatio === '9:16') {
      filterChain = 'crop=ih*9/16:ih'
    } else if (options.aspectRatio === '1:1') {
      filterChain = 'crop=ih:ih'
    }

    // Subtitles burning
    const subtitleFilter = `subtitles='${escapedSrtPath}':force_style='Fontname=${fontName},Fontsize=26,PrimaryColour=${assColor},Outline=2,OutlineColour=&H00000000,Alignment=2,MarginV=60'`
    
    if (filterChain) {
      filterChain = `${filterChain},${subtitleFilter}`
    } else {
      filterChain = subtitleFilter
    }

    const inputLoopFlag = isImage ? '-loop 1' : '-stream_loop -1'
    const pixFmtFlag = isImage ? '-pix_fmt yuv420p' : ''
    const renderCmd = `ffmpeg -y ${inputLoopFlag} -i "${tempVideoPath}" -i "${tempAudioPath}" -vf "${filterChain}" -map 0:v -map 1:a -c:v libx264 ${pixFmtFlag} -c:a aac -shortest "${outputPath}"`
    console.log(`[Render] Executing FFmpeg Render: ${renderCmd}`)
    await execPromise(renderCmd)

    // 6. Generate thumbnail from 1 second mark
    const thumbCmd = `ffmpeg -y -i "${outputPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`
    console.log(`[Render] Executing FFmpeg Thumbnail: ${thumbCmd}`)
    try {
      await execPromise(thumbCmd)
    } catch (e) {
      console.warn('[Render] Failed to generate custom thumbnail, falling back to stock image:', e)
    }

    // 7. Upload to ImageKit if keys are configured
    let returnedOutputUrl = `/rendered-videos/${videoFileName}`
    let returnedThumbnailUrl = fs.existsSync(thumbnailPath) 
      ? `/rendered-videos/${thumbFileName}` 
      : 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400'

    if (process.env.IMAGEKIT_PRIVATE_KEY) {
      try {
        console.log(`[Render] Uploading rendered video to ImageKit...`)
        const videoBuffer = fs.readFileSync(outputPath)
        returnedOutputUrl = await uploadToImageKit(videoBuffer, videoFileName, '/rendered-videos')

        if (fs.existsSync(thumbnailPath)) {
          console.log(`[Render] Uploading thumbnail to ImageKit...`)
          const thumbBuffer = fs.readFileSync(thumbnailPath)
          returnedThumbnailUrl = await uploadToImageKit(thumbBuffer, thumbFileName, '/rendered-videos')
        }
      } catch (uploadError) {
        console.error('[Render] ImageKit upload failed inside render:', uploadError)
      }
    }

    return {
      outputUrl: returnedOutputUrl,
      thumbnailUrl: returnedThumbnailUrl
    }
  } catch (error) {
    console.error('[Render] Rendering pipeline failed:', error)
    throw error
  } finally {
    // 8. Cleanup temp files
    console.log('[Render] Cleaning up temp files')
    try {
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath)
      if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath)
      if (fs.existsSync(tempSrtPath)) fs.unlinkSync(tempSrtPath)
      
      // If we uploaded to ImageKit, we can clean up the output files from local /tmp too!
      if (process.env.IMAGEKIT_PRIVATE_KEY) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
      }
    } catch (e) {
      console.error('[Render] Cleanup error:', e)
    }
  }
}
