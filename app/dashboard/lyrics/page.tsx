"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Video, CalendarDays, Instagram, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { LivePreview } from '@/components/lyrics-flow/LivePreview'
import { ThemeSelector, THEMES, ThemePreset } from '@/components/lyrics-flow/ThemeSelector'
import { AIGeneratorForm } from '@/components/lyrics-flow/AIGeneratorForm'

export default function LyricsFlowPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Core State
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEMES[0])
  const [lyricsText, setLyricsText] = useState("TUM SE HI\nDIN HOTA HAI\nSURMAYI SHAAM AATI HAI")
  const [caption, setCaption] = useState("Tag someone special ❤️✨\n\nFollow for more aesthetics 🎧\n#tumsehi #aesthetic #lofi #trending")
  const [audioUrl, setAudioUrl] = useState("")
  const [songName, setSongName] = useState("Tum Se Hi")
  
  // UI State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderStatus, setRenderStatus] = useState("")

  // Clean up audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleTogglePlay = () => {
    if (!audioUrl) {
      toast.info("No audio track selected yet. Try using AI Magic Fetch!")
      return
    }

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.pause()
      // If it's a YouTube URL, we cannot play it directly in HTML Audio tag.
      // But we can play it if it's a direct MP3 url or local path.
      // Let's warn the user if it's a YouTube URL and show a message that it's queued for rendering.
      if (audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be')) {
        toast.info("This song is selected from YouTube and is ready for rendering! (Direct preview is only available for MP3 files, but the full reel will render with this audio).")
        return
      }

      const audio = new Audio(audioUrl)
      audio.volume = 0.4
      audioRef.current = audio
      audio.play()
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
    }
  }

  // AI Magic Fetch
  const handleAIGenerate = async (query: string) => {
    setIsGeneratingAI(true)
    
    // Stop playback if running
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    try {
      const res = await fetch(`/api/ai-lyrics?query=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Magic Fetch failed")
      }

      if (data.lyrics) setLyricsText(data.lyrics)
      if (data.caption) setCaption(data.caption)
      if (data.audioUrl) setAudioUrl(data.audioUrl)
      if (data.songName) setSongName(data.songName)

      // Find matching theme or default to first
      const foundTheme = THEMES.find(t => t.id === data.themeId) || THEMES[0]
      setSelectedTheme(foundTheme)

      toast.success(`AI fetched song details for "${data.songName || query}"!`)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "An error occurred while fetching AI lyrics.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Draw Canvas & Export Image URL
  const generateCanvasImage = (): string => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error("Canvas element not found")
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error("Could not get 2D context")

    // 1080x1920 standard 9:16 portrait resolution
    canvas.width = 1080
    canvas.height = 1920

    // Draw Background gradient 
    // Format: linear-gradient(to bottom, #0f172a, #020617)
    const colors = selectedTheme.background.match(/#[0-9a-fA-F]{6}/g) || ["#000000", "#111111"]
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(1, colors[1] || colors[0])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // Draw Lyrics Stacked Centered
    ctx.fillStyle = selectedTheme.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Font mappings
    let fontName = selectedTheme.fontFamily
    if (fontName.includes('Caveat')) fontName = 'Caveat, cursive'
    else if (fontName.includes('Bangers')) fontName = 'Bangers, Impact'
    else if (fontName.includes('Montserrat')) fontName = 'Montserrat, sans-serif'
    else fontName = 'Inter, sans-serif'

    const baseFontSize = 24
    const lineSpacing = 10
    const scaledFontSize = baseFontSize * 3.6
    ctx.font = `bold ${scaledFontSize}px ${fontName}`

    const lines = lyricsText.toUpperCase().split('\n')
    const spacing = lineSpacing * 3.6
    const totalHeight = lines.length * (scaledFontSize + spacing)
    const startY = (1920 - totalHeight) / 2 + scaledFontSize / 2

    lines.forEach((line, index) => {
      const lineY = startY + index * (scaledFontSize + spacing)
      ctx.fillText(line, 1080 / 2, lineY)
    })

    return canvas.toDataURL('image/png')
  }

  // Render Pipeline
  const handleRenderReel = async () => {
    if (!audioUrl) {
      toast.error("Please use AI fetch to get a song or provide an audio URL first.")
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    setIsRendering(true)
    setRenderProgress(10)
    setRenderStatus("Compiling aesthetic visuals...")

    const intervals = [
      { delay: 1500, progress: 30, msg: "Downloading audio track..." },
      { delay: 4000, progress: 65, msg: "Executing FFmpeg render..." },
      { delay: 7500, progress: 85, msg: "Encoding video and subtitles..." },
      { delay: 9500, progress: 95, msg: "Uploading media to cloud storage (ImageKit)..." }
    ]

    intervals.forEach(item => {
      setTimeout(() => {
        if(isRendering) {
          setRenderProgress(item.progress)
          setRenderStatus(item.msg)
        }
      }, item.delay)
    })

    try {
      const bgImg = generateCanvasImage()
      const formData = new FormData()
      formData.append('backgroundImage', bgImg)
      formData.append('lyrics', lyricsText)
      formData.append('audioUrl', audioUrl)
      formData.append('songName', songName)

      const res = await fetch('/api/generate-lyrics', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Generation pipeline failed")
      }

      setRenderProgress(100)
      setRenderStatus("Lyrics Reel compiled and uploaded successfully!")
      toast.success("Lyrics Reel Ready to Post!")
      
      setTimeout(() => {
        router.push('/dashboard/videos')
      }, 1000)

    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "An error occurred during video rendering.")
      setIsRendering(false)
    }
  }


  return (
    <div className="container mx-auto py-8 max-w-6xl min-h-[calc(100vh-100px)] flex flex-col">
      {/* Dynamic Font Loads */}
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Bangers&family=Montserrat:wght@800&family=Inter:wght@700&display=swap" rel="stylesheet" />
      
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Render Overlay */}
      {isRendering && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full border border-border/50 rounded-[32px] p-8 shadow-2xl bg-card/50"
          >
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Wand2 className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Rendering Magic</h2>
              <p className="text-muted-foreground text-sm">{renderStatus}</p>
              
              <div className="w-full bg-muted/50 rounded-full h-2 mt-8 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <p className="text-xs font-bold text-primary text-right mt-2">{renderProgress}%</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
          LyricsFlow AI
        </h1>
        <p className="text-muted-foreground text-lg">Generate aesthetic Instagram reels from trending songs automatically.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <LivePreview 
            themeStyle={{
              background: selectedTheme.background,
              color: selectedTheme.color,
              fontFamily: selectedTheme.fontFamily
            }}
            lyricsText={lyricsText}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            fontSize={24}
            lineSpacing={10}
          />
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-7 space-y-8 flex flex-col h-full">
          
          <Tabs defaultValue="create" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mb-6 bg-muted/50 p-1 rounded-full">
              <TabsTrigger value="create" className="rounded-full">AI Studio</TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-full">Auto-Post Scheduler</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 space-y-8 mt-0 outline-none">
              <AIGeneratorForm 
                onAIGenerate={handleAIGenerate}
                isGeneratingAI={isGeneratingAI}
                lyrics={lyricsText}
                setLyrics={setLyricsText}
                caption={caption}
                setCaption={setCaption}
              />

              <ThemeSelector 
                selectedThemeId={selectedTheme.id}
                onSelectTheme={setSelectedTheme}
              />
            </TabsContent>

            <TabsContent value="schedule" className="flex-1 mt-0 outline-none">
              <div className="bg-muted/30 border rounded-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Instagram className="h-8 w-8 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Connect Instagram</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Connect your professional account to automatically schedule and post reels generated by LyricsFlow.
                  </p>
                </div>
                <Button variant="outline" className="gap-2 border-pink-500/20 hover:bg-pink-500/10">
                  <Instagram className="h-4 w-4" />
                  Connect Account (Coming Soon)
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Footer */}
          <div className="pt-6 mt-auto flex gap-4">
            <Button 
              className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
              onClick={handleRenderReel}
            >
              <Video className="h-5 w-5 mr-2" />
              Generate Reel
            </Button>
            <Button 
              variant="outline" 
              className="h-14 px-8 border-border/50 shadow-sm"
              onClick={() => toast.info("Instagram Scheduler requires Meta Graph API setup (Phase 2).")}
            >
              <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
              Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
