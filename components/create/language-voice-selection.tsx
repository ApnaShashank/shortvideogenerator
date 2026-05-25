"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Languages, Mic, Play, Pause, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateStepFooter } from "@/components/create/CreateStepFooter"
import { toast } from "sonner"

// These map to Deepgram Aura voice model IDs
const VOICES = [
  // English Voices (Deepgram Aura)
  { id: "asteria",   name: "Asteria",   language: "english", gender: "Female", description: "Warm, natural, and expressive.", deepgramModel: "aura-asteria-en" },
  { id: "luna",      name: "Luna",      language: "english", gender: "Female", description: "Soft, gentle, and soothing.", deepgramModel: "aura-luna-en" },
  { id: "stella",    name: "Stella",    language: "english", gender: "Female", description: "Bright, clear, and confident.", deepgramModel: "aura-stella-en" },
  { id: "athena",    name: "Athena",    language: "english", gender: "Female", description: "Professional, focused, and precise.", deepgramModel: "aura-athena-en" },
  { id: "hera",      name: "Hera",      language: "english", gender: "Female", description: "Authoritative and powerful.", deepgramModel: "aura-hera-en" },
  { id: "orion",     name: "Orion",     language: "english", gender: "Male",   description: "Deep, resonant, and trustworthy.", deepgramModel: "aura-orion-en" },
  { id: "arcas",     name: "Arcas",     language: "english", gender: "Male",   description: "Calm, measured, and composed.", deepgramModel: "aura-arcas-en" },
  { id: "perseus",   name: "Perseus",   language: "english", gender: "Male",   description: "Energetic and dynamic.", deepgramModel: "aura-perseus-en" },
  { id: "orpheus",   name: "Orpheus",   language: "english", gender: "Male",   description: "Poetic, story-telling quality.", deepgramModel: "aura-orpheus-en" },
  { id: "helios",    name: "Helios",    language: "english", gender: "Male",   description: "Bright, uplifting, and cheerful.", deepgramModel: "aura-helios-en" },
  { id: "zeus",      name: "Zeus",      language: "english", gender: "Male",   description: "Commanding and authoritative.", deepgramModel: "aura-zeus-en" },

  // For Hindi, we use Asteria as best-effort (Deepgram doesn't have a native Hindi model yet)
  { id: "asteria-hi", name: "Asteria (Hindi)", language: "hindi", gender: "Female", description: "Hindi narration using AI voice.", deepgramModel: "aura-asteria-en" },
  { id: "orion-hi",   name: "Orion (Hindi)",   language: "hindi", gender: "Male",   description: "Hindi male narration using AI voice.", deepgramModel: "aura-orion-en" },
]

// Sample preview text per voice
const PREVIEW_TEXTS: Record<string, string> = {
  english: "Hello! I'm ready to narrate your short video. This voice will bring your story to life.",
  hindi: "नमस्ते! मैं आपके शॉर्ट वीडियो को बेहतरीन तरीके से प्रस्तुत करने के लिए तैयार हूँ।",
}

interface LanguageVoiceSelectionProps {
  formData: {
    language: string
    voice: string
  }
  updateFormData: (key: string, value: any) => void
  onNext: () => void
  onBack: () => void
}

export function LanguageVoiceSelection({ formData, updateFormData, onNext, onBack }: LanguageVoiceSelectionProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  // Use Deepgram TTS API for live voice preview
  const previewVoice = async (voiceId: string, deepgramModel: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
    }

    if (playingVoice === voiceId) {
      setPlayingVoice(null)
      return
    }

    setLoadingVoice(voiceId)

    try {
      const previewText = PREVIEW_TEXTS[formData.language] || PREVIEW_TEXTS.english

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          voice: voiceId,
          language: formData.language,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'TTS preview failed')
      }

      const data = await response.json()
      const audio = new Audio(data.audioDataUrl)
      audioRef.current = audio
      audio.play()
      setPlayingVoice(voiceId)
      audio.onended = () => setPlayingVoice(null)
      audio.onerror = () => {
        setPlayingVoice(null)
        toast.error("Audio playback failed.")
      }
    } catch (err: any) {
      console.error('Voice preview error:', err)
      toast.error(err.message || "Failed to preview voice. Check your API key.")
    } finally {
      setLoadingVoice(null)
    }
  }

  // Filter voices based on selected language
  const filteredVoices = VOICES.filter(v => v.language === formData.language)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Language & Voice</h2>
        <p className="text-muted-foreground mt-2">Choose the language and AI voice for your narration. Click Preview to hear real Deepgram TTS.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-950 dark:text-blue-400">
                <Languages className="h-5 w-5" />
              </div>
              <CardTitle>Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.language} 
              onValueChange={(val) => {
                updateFormData('language', val)
                updateFormData('voice', "") // Reset voice on language change
                // Stop audio
                if (audioRef.current) audioRef.current.pause()
                setPlayingVoice(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">🇺🇸 English (US)</SelectItem>
                <SelectItem value="hindi">🇮🇳 Hindi</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Voice Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-950 dark:text-purple-400">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Select AI Voice</h3>
              <p className="text-xs text-muted-foreground">Powered by Deepgram Aura TTS — click Preview to hear live audio</p>
            </div>
          </div>
          
          <ScrollArea className="h-[420px] rounded-md border p-4 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVoices.map((voice) => {
                const isSelected = formData.voice === voice.id
                const isPlaying = playingVoice === voice.id
                const isLoading = loadingVoice === voice.id

                return (
                  <Card 
                    key={voice.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden",
                      isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                    )}
                    onClick={() => updateFormData('voice', voice.id)}
                  >
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">{voice.gender}</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{voice.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{voice.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex justify-between items-center">
                      <Button 
                        size="sm" 
                        variant={isPlaying ? "default" : "outline"}
                        className="gap-2 z-10"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          previewVoice(voice.id, voice.deepgramModel)
                        }}
                      >
                        {isLoading ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Loading...</>
                        ) : isPlaying ? (
                          <><Pause className="h-3 w-3" /> Stop</>
                        ) : (
                          <><Play className="h-3 w-3" /> Preview</>
                        )}
                      </Button>

                      {isSelected && (
                        <div className="flex items-center text-primary text-sm font-medium animate-in fade-in zoom-in">
                          <Check className="h-4 w-4 mr-1" /> Selected
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
              {filteredVoices.length === 0 && (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  No voices available for this language yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <CreateStepFooter 
        onBack={() => {
          if (audioRef.current) {
            audioRef.current.pause()
            setPlayingVoice(null)
          }
          onBack()
        }}
        onContinue={() => {
          if (audioRef.current) {
            audioRef.current.pause()
            setPlayingVoice(null)
          }
          onNext()
        }}
        canContinue={!!formData.language && !!formData.voice}
      />
    </div>
  )
}
