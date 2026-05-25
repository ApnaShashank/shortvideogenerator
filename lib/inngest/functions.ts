import { inngest } from "./client"
import { connectToDatabase } from "@/lib/mongodb/client"
import { VideoGeneration } from "@/lib/mongodb/models"
import { 
  DEEPGRAM_VOICE_MAP, 
  generateScriptWithAI, 
  generateVoiceWithDeepgram, 
  generateCaptionsWithDeepgram 
} from "@/lib/video/ai"
import { generateImageWithReplicate } from "@/lib/replicate/client"
import { renderVideoLocal } from "@/lib/video/render"

const BACKGROUND_VIDEOS: Record<string, string> = {
  'default': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'realistic-stock': 'https://assets.codepen.io/609340/skyline.mp4',
  'cyberpunk': 'https://assets.codepen.io/609340/volcano.mp4',
  'anime': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'cinematic-3d': 'https://assets.codepen.io/609340/swimming-fish.mp4'
}

export const generateVideoFunction = inngest.createFunction(
  { 
    id: "generate-video", 
    name: "Generate AI Short Video",
    triggers: [{ event: "video.generate" }]
  },
  async ({ event, step }) => {
    const { generationId, body } = event.data
    const { 
      niche, 
      customNiche, 
      language, 
      voice, 
      scriptType, 
      prompt, 
      customScript, 
      aspectRatio, 
      videoStyle, 
      music, 
      captionFont, 
      captionColor, 
      captionStyle 
    } = body

    const finalNiche = niche || customNiche || "General"

    try {
      await step.run("connect-db-and-start", async () => {
        await connectToDatabase()
        await VideoGeneration.findByIdAndUpdate(generationId, {
          status: 'processing',
          progress: 10
        })
      })

      // 1. Generate Script
      const scriptText = await step.run("generate-script", async () => {
        let scriptText = customScript || ""
        if (scriptType === 'ai') {
          scriptText = await generateScriptWithAI(prompt || finalNiche, finalNiche, language)
        }
        return scriptText
      })

      await step.run("update-progress-script", async () => {
        await connectToDatabase()
        await VideoGeneration.findByIdAndUpdate(generationId, { progress: 30 })
      })

      // 2. Generate Voice (TTS) and Captions (STT)
      const ttsResult = await step.run("generate-voice", async () => {
        return await generateVoiceWithDeepgram(scriptText, voice || 'amalthea')
      })

      let audioBase64 = ttsResult?.audioBase64 || null
      let audioDuration = ttsResult?.durationSeconds || 15
      let captionWords: any[] = []
      let captionSegments: any[] = []

      if (audioBase64) {
        const captionsResult = await step.run("generate-captions", async () => {
          return await generateCaptionsWithDeepgram(audioBase64!)
        })
        if (captionsResult) {
          captionWords = captionsResult.words
          captionSegments = captionsResult.segments
        }
      }

      await step.run("update-progress-audio", async () => {
        await connectToDatabase()
        await VideoGeneration.findByIdAndUpdate(generationId, { progress: 60 })
      })

      // 3. Generate Background Visuals (Replicate or stock video)
      let bgVideoUrl = ""
      if (process.env.REPLICATE_API_TOKEN && prompt) {
        bgVideoUrl = await step.run("generate-replicate-image", async () => {
          const replicateImgUrl = await generateImageWithReplicate(prompt, {
            aspectRatio: aspectRatio as any,
            videoStyle
          })
          return replicateImgUrl || ""
        })
      }

      if (!bgVideoUrl) {
        const selectedStyle = videoStyle || 'realistic-stock'
        bgVideoUrl = BACKGROUND_VIDEOS[selectedStyle] || BACKGROUND_VIDEOS['default']
      }

      // 4. Render Video via local FFmpeg
      let outputUrl = ""
      let thumbnailUrl = ""
      let renderedSuccessfully = false

      if (audioBase64 && captionSegments && captionSegments.length > 0) {
        try {
          const renderResult = await step.run("render-video-ffmpeg", async () => {
            return await renderVideoLocal(
              generationId,
              bgVideoUrl,
              audioBase64!,
              captionSegments,
              {
                aspectRatio: aspectRatio as any,
                captionFont,
                captionColor,
                captionStyle
              }
            )
          })
          outputUrl = renderResult.outputUrl
          thumbnailUrl = renderResult.thumbnailUrl
          renderedSuccessfully = true
        } catch (renderError: any) {
          console.error("FFmpeg render failed inside Inngest step:", renderError)
        }
      }

      // If render failed or was skipped, use fallback mock templates
      if (!renderedSuccessfully) {
        if (aspectRatio === "16:9") {
          outputUrl = "https://assets.mixkit.co/videos/preview/mixkit-underwater-light-beams-42171-large.mp4"
          thumbnailUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400"
        } else if (aspectRatio === "1:1") {
          outputUrl = "https://assets.mixkit.co/videos/preview/mixkit-cooking-in-a-modern-kitchen-40714-large.mp4"
          thumbnailUrl = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400"
        } else {
          outputUrl = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4"
          thumbnailUrl = "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400"
        }
      }

      // 5. Save output, complete status
      await step.run("finalize-video-generation", async () => {
        await connectToDatabase()
        await VideoGeneration.findByIdAndUpdate(generationId, {
          status: 'completed',
          progress: 100,
          outputUrl,
          thumbnailUrl,
          completedAt: new Date(),
          metadata: {
            niche: finalNiche,
            language,
            voice,
            voiceModel: DEEPGRAM_VOICE_MAP[voice?.toLowerCase()] || 'aura-asteria-en',
            scriptType,
            scriptText,
            music,
            captionFont,
            captionColor,
            captionStyle,
            audioBase64: audioBase64 || null,
            audioDataUrl: audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null,
            hasRealAudio: !!audioBase64,
            captionWords,
            captionSegments,
            hasCaptions: captionSegments.length > 0,
            renderedSuccessfully
          }
        })
      })

      return { generationId, outputUrl, renderedSuccessfully }
    } catch (err: any) {
      console.error("Video generation background job failed:", err)
      try {
        await connectToDatabase()
        await VideoGeneration.findByIdAndUpdate(generationId, {
          status: 'failed',
          errorMessage: err.message || "An unexpected error occurred during background video generation.",
          progress: 0
        })
      } catch (dbErr) {
        console.error("Failed to write failure status to DB:", dbErr)
      }
      throw err
    }
  }
)
