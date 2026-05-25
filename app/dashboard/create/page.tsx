"use client"

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Check, 
  Ghost, 
  Lightbulb, 
  BookOpen, 
  Briefcase, 
  Brain, 
  Globe, 
  Languages, 
  Mic, 
  Play, 
  Pause, 
  Loader2, 
  Sparkles, 
  FileText, 
  Smartphone, 
  Monitor, 
  Square, 
  Palette, 
  Music, 
  Volume2, 
  Type, 
  Video, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateStepFooter } from "@/components/create/CreateStepFooter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LanguageVoiceSelection } from "@/components/create/language-voice-selection"
import { toast } from "sonner"
import { getProjectById } from "@/actions/project"

const STEPS = [
  { id: 1, name: "Niche" },
  { id: 2, name: "Language" },
  { id: 3, name: "Source" },
  { id: 4, name: "Video" },
  { id: 5, name: "Caption" },
  { id: 6, name: "Review" }
]

const AVAILABLE_NICHES = [
  {
    id: "scary-stories",
    title: "Scary Stories",
    description: "Spooky tales and urban legends to keep viewers on the edge.",
    icon: Ghost,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
  },
  {
    id: "motivation",
    title: "Motivation",
    description: "Inspiring quotes and speeches to boost morale and productivity.",
    icon: Lightbulb,
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
  },
  {
    id: "fun-facts",
    title: "Fun Facts",
    description: "Interesting and surprising facts about the world.",
    icon: Globe,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
  },
  {
    id: "history",
    title: "History",
    description: "Historical events and figures explained simply.",
    icon: BookOpen,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
  },
  {
    id: "business",
    title: "Business",
    description: "Tips, tricks, and insights into the corporate world.",
    icon: Briefcase,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400"
  },
  {
    id: "philosophy",
    title: "Philosophy",
    description: "Deep thoughts and stoic wisdom for modern life.",
    icon: Brain,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
  }
]

const MUSIC_TRACKS = [
  { id: "marketing-469052", name: "Instagram Reels Marketing", url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-469052.mp3", duration: "0:30", genre: "Upbeat" },
  { id: "trending-447249", name: "Trending Reels Music", url: "https://ik.imagekit.io/Tubeguruji/BgMusic/trending-instagram-reels-music-447249.mp3", duration: "0:15", genre: "Trendy" },
  { id: "marketing-384448", name: "Marketing Promo", url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-384448.mp3", duration: "0:45", genre: "Corporate" },
  { id: "basketball-461852", name: "Basketball Energy", url: "https://ik.imagekit.io/Tubeguruji/BgMusic/basketball-instagram-reels-music-461852.mp3", duration: "0:20", genre: "Sports" },
  { id: "dramatic-148505", name: "Dramatic Hip Hop Jazz", url: "https://ik.imagekit.io/Tubeguruji/BgMusic/dramatio-hip-hop-musio-background-jazz-music-for-short-video-148505.mp3", duration: "1:00", genre: "Cinematic" }
]

const PRESET_PROMPTS = [
  "Write 5 fascinating facts about the deep ocean that sound fake but are 100% real.",
  "Create an inspiring motivational script about learning from failures and building resilience.",
  "Tell a spooky urban legend about a ghost train that appears on abandoned tracks at midnight.",
  "Write a short, engaging summary of the daily life of a gladiator in ancient Rome.",
  "Explain Stoic philosophy's concept of 'Amor Fati' and how to apply it in modern life."
]

interface SeriesFormData {
  niche: string | null
  customNiche: string
  language: string
  voice: string
  scriptType: 'ai' | 'custom'
  prompt: string
  customScript: string
  aspectRatio: '9:16' | '16:9' | '1:1'
  videoStyle: string
  music: string
  captionFont: string
  captionColor: string
  captionStyle: string
}

export default function CreateSeriesPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("Preparing...")
  
  const [formData, setFormData] = useState<SeriesFormData>({
    niche: null,
    customNiche: "",
    language: "english",
    voice: "amalthea",
    scriptType: "ai",
    prompt: "",
    customScript: "",
    aspectRatio: "9:16",
    videoStyle: "realistic-stock",
    music: "trending-447249",
    captionFont: "Impact",
    captionColor: "#eab308", // Yellow-500
    captionStyle: "karaoke"
  })

  // Audio preview states for step 4
  const [playingMusic, setPlayingMusic] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const toggleMusic = (url: string, id: string) => {
    if (playingMusic === id) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingMusic(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.volume = 0.3
      audio.play()
      audio.onended = () => setPlayingMusic(null)
      setPlayingMusic(id)
    }
  }
  
  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleNicheSelect = (id: string) => {
    updateFormData('niche', id)
    if (formData.customNiche) updateFormData('customNiche', "")
  }

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingMusic(null)
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const handleBack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingMusic(null)
    }
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Trigger video generation
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(5)
    setStatusMessage("Creating series draft...")
    
    // Simulate progression updates
    const intervals = [
      { delay: 1500, progress: 15, msg: "Connecting to database & creating record..." },
      { delay: 3500, progress: 35, msg: "Generating narration script using AI model..." },
      { delay: 6500, progress: 55, msg: "Synthesizing voice narration track (Aura TTS)..." },
      { delay: 9000, progress: 75, msg: "Fetching visual assets and licensing media..." },
      { delay: 12000, progress: 90, msg: "Stitching audio, video, and rendering subtitles..." },
      { delay: 14500, progress: 98, msg: "Finalizing MP4 video file and uploading to cloud storage..." }
    ]

    intervals.forEach(item => {
      setTimeout(() => {
        setGenerationProgress(item.progress)
        setStatusMessage(item.msg)
      }, item.delay)
    })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video")
      }

      setGenerationProgress(100)
      setStatusMessage("Video generated successfully!")
      toast.success("Short Video generated successfully!")
      
      setTimeout(() => {
        router.push('/dashboard/videos')
      }, 1000)
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "An error occurred during video generation.")
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-2 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Generating Video
              </CardTitle>
              <CardDescription>We are compiling your short video series. This takes around 15-20 seconds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-muted-foreground">{statusMessage}</span>
                <span className="text-primary">{generationProgress}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10">
            <div className="h-1 w-full bg-muted rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
          
          {STEPS.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm transition-colors duration-300 cursor-pointer",
                  currentStep === step.id 
                    ? "border-primary bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                    : currentStep > step.id
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : <span>{step.id}</span>}
              </div>
              <span className={cn(
                "text-xs font-semibold hidden md:inline transition-colors duration-300",
                currentStep >= step.id ? "text-primary" : "text-muted-foreground"
              )}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Niche Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Select a Niche</h2>
            <p className="text-muted-foreground mt-2">Choose the topic for your short video series.</p>
          </div>

          <Tabs defaultValue={formData.customNiche ? "custom" : "available"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto mb-8">
              <TabsTrigger value="available">Available Niches</TabsTrigger>
              <TabsTrigger value="custom">Custom Niche</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <ScrollArea className="h-[460px] rounded-xl border p-4 bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_NICHES.map((niche) => {
                    const isSelected = formData.niche === niche.id
                    const Icon = niche.icon
                    
                    return (
                      <Card 
                        key={niche.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                          isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                        )}
                        onClick={() => handleNicheSelect(niche.id)}
                      >
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className={cn("p-2 rounded-lg", niche.color)}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <CardTitle className="text-lg font-bold">{niche.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{niche.description}</CardDescription>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Create Custom Niche</CardTitle>
                  <CardDescription>
                    Enter a specific topic or niche that isn't listed in presets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-niche">Niche Name</Label>
                    <Input 
                      id="custom-niche" 
                      placeholder="e.g. Ancient Greek Warfare Secrets" 
                      value={formData.customNiche}
                      onChange={(e) => {
                        updateFormData('customNiche', e.target.value)
                        updateFormData('niche', null) // Deselect available
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <CreateStepFooter 
            onContinue={handleNext}
            canContinue={!!formData.niche || !!formData.customNiche}
          />
        </div>
      )}

      {/* Step 2: Language & Voice */}
      {currentStep === 2 && (
        <LanguageVoiceSelection 
          formData={formData}
          updateFormData={updateFormData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {/* Step 3: Script Source Selection */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Script Source</h2>
            <p className="text-muted-foreground mt-2">Decide how to get your video script narration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Option AI */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                formData.scriptType === "ai" && "border-primary ring-2 ring-primary/20 bg-primary/5"
              )}
              onClick={() => updateFormData('scriptType', 'ai')}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Script Writer</CardTitle>
                  <CardDescription>Write prompts and let AI craft the script</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <Label htmlFor="ai-prompt">AI Generation Prompt</Label>
                <Textarea 
                  id="ai-prompt"
                  placeholder="e.g. Write an engaging script with 5 crazy psychological tricks to read people instantly..."
                  rows={4}
                  value={formData.prompt}
                  onChange={(e) => {
                    updateFormData('prompt', e.target.value)
                    updateFormData('scriptType', 'ai')
                  }}
                />
                
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Click a preset prompt idea:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map((preset, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-muted font-normal text-xs"
                        onClick={() => {
                          updateFormData('prompt', preset)
                          updateFormData('scriptType', 'ai')
                        }}
                      >
                        Idea {index + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Option Custom */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                formData.scriptType === "custom" && "border-primary ring-2 ring-primary/20 bg-primary/5"
              )}
              onClick={() => updateFormData('scriptType', 'custom')}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Write Custom Script</CardTitle>
                  <CardDescription>Paste or write your own narration script</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <Label htmlFor="custom-script">Narration Script Text</Label>
                <Textarea 
                  id="custom-script"
                  placeholder="Paste your script text here. This script will be converted to voice. Ideally 50 - 150 words for short video..."
                  rows={8}
                  value={formData.customScript}
                  onChange={(e) => {
                    updateFormData('customScript', e.target.value)
                    updateFormData('scriptType', 'custom')
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <CreateStepFooter 
            onBack={handleBack}
            onContinue={handleNext}
            canContinue={formData.scriptType === 'ai' ? !!formData.prompt : !!formData.customScript}
          />
        </div>
      )}

      {/* Step 4: Video Style & Music Selection */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Video & Music</h2>
            <p className="text-muted-foreground mt-2">Customize the visuals and audio settings.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Aspect Ratio */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Select Aspect Ratio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "9:16", title: "Vertical (9:16)", desc: "Shorts, Reels, TikTok", icon: Smartphone },
                  { id: "16:9", title: "Horizontal (16:9)", desc: "YouTube, Website", icon: Monitor },
                  { id: "1:1", title: "Square (1:1)", desc: "Instagram, Feed", icon: Square }
                ].map((item) => {
                  const isSelected = formData.aspectRatio === item.id
                  const Icon = item.icon
                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all text-center p-4",
                        isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5"
                      )}
                      onClick={() => updateFormData('aspectRatio', item.id)}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Video Style */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Select Video Style
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "realistic-stock", name: "Realistic Stock" },
                  { id: "anime", name: "Anime Illustrative" },
                  { id: "cyberpunk", name: "Cyberpunk Futuristic" },
                  { id: "cinematic-3d", name: "Cinematic 3D" }
                ].map((style) => {
                  const isSelected = formData.videoStyle === style.id
                  return (
                    <Card
                      key={style.id}
                      className={cn(
                        "cursor-pointer text-center p-3 font-semibold text-sm hover:border-primary/50 transition-all",
                        isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5"
                      )}
                      onClick={() => updateFormData('videoStyle', style.id)}
                    >
                      {style.name}
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Background Music */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Select Background Music
              </h3>
              <Card className="border">
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px]">
                    <div className="divide-y">
                      {MUSIC_TRACKS.map((track) => {
                        const isSelected = formData.music === track.id
                        const isPlaying = playingMusic === track.id

                        return (
                          <div 
                            key={track.id}
                            className={cn(
                              "flex items-center justify-between p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                              isSelected && "bg-primary/5"
                            )}
                            onClick={() => updateFormData('music', track.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                size="icon"
                                variant={isPlaying ? "default" : "outline"}
                                className="rounded-full h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleMusic(track.url, track.id)
                                }}
                              >
                                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                              </Button>
                              
                              <div>
                                <h4 className={cn("text-sm font-semibold", isSelected && "text-primary")}>
                                  {track.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {track.genre}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Volume2 className="h-2.5 w-2.5" />
                                    {track.duration}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {isSelected && (
                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center mr-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          <CreateStepFooter 
            onBack={handleBack}
            onContinue={handleNext}
            canContinue={!!formData.aspectRatio && !!formData.videoStyle && !!formData.music}
          />
        </div>
      )}

      {/* Step 5: Caption Style */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Subtitle Style</h2>
            <p className="text-muted-foreground mt-2">Design how the captions appear on video.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Subtitle Style options */}
            <Card className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="font-select" className="flex items-center gap-2 font-semibold">
                  <Type className="h-4 w-4" /> Font Style
                </Label>
                <Select value={formData.captionFont} onValueChange={(val) => updateFormData('captionFont', val)}>
                  <SelectTrigger id="font-select">
                    <SelectValue placeholder="Font Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Impact">Impact (Bold, Viral style)</SelectItem>
                    <SelectItem value="Inter">Inter (Clean, Modern)</SelectItem>
                    <SelectItem value="Montserrat">Montserrat (Geometric)</SelectItem>
                    <SelectItem value="Bangers">Bangers (Comic style)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <Palette className="h-4 w-4" /> Highlight Color
                </Label>
                <div className="flex items-center gap-3">
                  {[
                    { hex: "#eab308", name: "Yellow" },
                    { hex: "#ffffff", name: "White" },
                    { hex: "#22c55e", name: "Green" },
                    { hex: "#06b6d4", name: "Cyan" },
                    { hex: "#ff007f", name: "Pink" }
                  ].map((color) => {
                    const isSelected = formData.captionColor === color.hex
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                          isSelected ? "border-primary scale-110 ring-2 ring-primary/20" : "border-muted"
                        )}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => updateFormData('captionColor', color.hex)}
                        title={color.name}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  Animation Style
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "karaoke", title: "Word Highlight (Karaoke)", desc: "Highlights words as spoken." },
                    { id: "classic", title: "Classic Block", desc: "Displays block sentences statically." },
                    { id: "zoom", title: "Zoom Animation", desc: "Words pop up with subtle zoom animation." }
                  ].map((style) => {
                    const isSelected = formData.captionStyle === style.id
                    return (
                      <Card
                        key={style.id}
                        className={cn(
                          "cursor-pointer p-3 hover:border-primary/50 transition-all",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => updateFormData('captionStyle', style.id)}
                      >
                        <h4 className="text-sm font-semibold">{style.title}</h4>
                        <p className="text-xs text-muted-foreground">{style.desc}</p>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Subtitle Preview */}
            <Card className="flex flex-col items-center justify-center p-4 bg-slate-900 border-2 text-white relative overflow-hidden min-h-[380px] rounded-xl">
              <span className="absolute top-2 left-2 text-xs text-slate-500 font-mono">LIVE STYLE PREVIEW</span>
              
              <div className="relative text-center select-none">
                <p className="text-slate-400 text-xs mb-6 uppercase tracking-wider">Example Video Subtitle Preview</p>
                <div className="space-y-4">
                  <span 
                    className="block text-3xl font-extrabold tracking-wide uppercase stroke-black select-none"
                    style={{ 
                      fontFamily: formData.captionFont, 
                      color: "#ffffff",
                      textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
                    }}
                  >
                    THE SECRET TO
                  </span>
                  
                  <span 
                    className="block text-4xl font-extrabold tracking-wide uppercase transition-all duration-300"
                    style={{ 
                      fontFamily: formData.captionFont, 
                      color: formData.captionColor,
                      textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
                    }}
                  >
                    {formData.captionStyle === 'karaoke' ? '✔ PRODUCTIVITY' : 'PRODUCTIVITY'}
                  </span>

                  <span 
                    className="block text-3xl font-extrabold tracking-wide uppercase select-none"
                    style={{ 
                      fontFamily: formData.captionFont, 
                      color: "#ffffff",
                      textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
                    }}
                  >
                    IS FOCUS.
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <CreateStepFooter 
            onBack={handleBack}
            onContinue={handleNext}
            canContinue={!!formData.captionFont && !!formData.captionColor && !!formData.captionStyle}
          />
        </div>
      )}

      {/* Step 6: Review & Submit */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Review & Generate</h2>
            <p className="text-muted-foreground mt-2">Double check configurations before generating the video.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Configuration Details */}
            <Card className="lg:col-span-2 shadow-sm border-2">
              <CardHeader className="bg-muted/10 border-b pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Setup Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4 space-y-4 divide-y divide-muted/50">
                {/* Topic / Niche */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Niche / Topic</h4>
                    <p className="text-xs text-muted-foreground">The theme for your video content</p>
                  </div>
                  <Badge variant="outline" className="text-sm capitalize py-1 px-3">
                    {formData.niche || formData.customNiche}
                  </Badge>
                </div>

                {/* Voice / Lang */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Language & Voice Model</h4>
                    <p className="text-xs text-muted-foreground">The voice model speaking the narration</p>
                  </div>
                  <Badge variant="outline" className="text-sm capitalize py-1 px-3">
                    {formData.language} ({formData.voice})
                  </Badge>
                </div>

                {/* Script Source */}
                <div className="flex justify-between items-start py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Script Generation Source</h4>
                    <p className="text-xs text-muted-foreground">How the script text is produced</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-sm py-1 px-3 capitalize mb-1 inline-block">
                      {formData.scriptType === 'ai' ? 'AI Generator Prompt' : 'Custom Input Script'}
                    </Badge>
                    <p className="text-xs text-muted-foreground max-w-[250px] truncate">
                      {formData.scriptType === 'ai' ? formData.prompt : formData.customScript}
                    </p>
                  </div>
                </div>

                {/* Aspect ratio & style */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Style & Resolution</h4>
                    <p className="text-xs text-muted-foreground">Aspect ratio layout & preset video style</p>
                  </div>
                  <Badge variant="outline" className="text-sm py-1 px-3 capitalize">
                    {formData.aspectRatio} | {formData.videoStyle}
                  </Badge>
                </div>

                {/* Music */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Background Music</h4>
                    <p className="text-xs text-muted-foreground">The audio track played in background</p>
                  </div>
                  <Badge variant="outline" className="text-sm py-1 px-3 capitalize">
                    {MUSIC_TRACKS.find(m => m.id === formData.music)?.name || "Preset Music"}
                  </Badge>
                </div>

                {/* Captions font */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Caption Styling</h4>
                    <p className="text-xs text-muted-foreground">Subtitles formatting configuration</p>
                  </div>
                  <Badge variant="outline" className="text-sm py-1 px-3 capitalize">
                    {formData.captionFont} | {formData.captionStyle}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Box */}
            <Card className="border-2 border-primary/20 shadow-md flex flex-col justify-between h-fit lg:sticky lg:top-24">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg">Proceed to Generate</CardTitle>
                <CardDescription>Estimated processing time: ~15 seconds</CardDescription>
              </CardHeader>
              <CardContent className="py-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-semibold text-muted-foreground">Credits Cost</span>
                  <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 fill-amber-600" /> 1 Credit
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  By clicking Generate, you agree to deduct 1 credit from your user account ledger.
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full gap-2 shadow-md" size="lg" onClick={handleGenerate}>
                  <Sparkles className="h-4 w-4" />
                  Generate Short Video
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex justify-between items-center max-w-4xl mx-auto pt-6 border-t">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to captions
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
