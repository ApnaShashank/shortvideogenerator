"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Music, Play, Pause, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateStepFooter } from "@/components/create/CreateStepFooter"

const MUSIC_TRACKS = [
    { 
        id: "marketing-469052", 
        name: "Instagram Reels Marketing", 
        url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-469052.mp3", 
        duration: "0:30",
        genre: "Upbeat"
    },
    { 
        id: "trending-447249", 
        name: "Trending Reels Music", 
        url: "https://ik.imagekit.io/Tubeguruji/BgMusic/trending-instagram-reels-music-447249.mp3", 
        duration: "0:15",
        genre: "Trendy"
    },
    { 
        id: "marketing-384448", 
        name: "Marketing Promo", 
        url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-384448.mp3", 
        duration: "0:45",
        genre: "Corporate"
    },
    { 
        id: "basketball-461852", 
        name: "Basketball Energy", 
        url: "https://ik.imagekit.io/Tubeguruji/BgMusic/basketball-instagram-reels-music-461852.mp3", 
        duration: "0:20",
        genre: "Sports"
    },
    { 
        id: "dramatic-148505", 
        name: "Dramatic Hip Hop Jazz", 
        url: "https://ik.imagekit.io/Tubeguruji/BgMusic/dramatio-hip-hop-musio-background-jazz-music-for-short-video-148505.mp3", 
        duration: "1:00",
        genre: "Cinematic"
    },
]

interface BackgroundMusicSelectionProps {
  formData: {
    music: string
  }
  updateFormData: (key: string, value: any) => void
  onNext: () => void
  onBack: () => void
}

export function BackgroundMusicSelection({ formData, updateFormData, onNext, onBack }: BackgroundMusicSelectionProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }
  }, [])

  const toggleAudio = (url: string, id: string) => {
    if (playingTrack === id) {
        if (audioRef.current) {
            audioRef.current.pause()
        }
        setPlayingTrack(null)
    } else {
        if (audioRef.current) {
            audioRef.current.pause()
        }
        const audio = new Audio(url)
        audioRef.current = audio
        audio.volume = 0.5
        audio.play()
        audio.onended = () => setPlayingTrack(null)
        setPlayingTrack(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Background Music</h2>
        <p className="text-muted-foreground mt-2">Select a background track to set the mood for your video.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="border-2">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                        <Music className="h-5 w-5" />
                    </div>
                    <CardTitle>Available Tracks</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                        {MUSIC_TRACKS.map((track) => {
                            const isSelected = formData.music === track.id
                            const isPlaying = playingTrack === track.id

                            return (
                                <div 
                                    key={track.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                                        isSelected && "bg-pink-50 hover:bg-pink-50"
                                    )}
                                    onClick={() => updateFormData('music', track.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <Button
                                            size="icon"
                                            variant={isPlaying ? "default" : "outline"}
                                            className={cn(
                                                "rounded-full h-10 w-10 shrink-0",
                                                isPlaying ? "bg-pink-600 hover:bg-pink-700" : ""
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleAudio(track.url, track.id)
                                            }}
                                        >
                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                                        </Button>
                                        
                                        <div>
                                            <h4 className={cn("font-medium", isSelected && "text-pink-700")}>
                                                {track.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {track.genre}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Volume2 className="h-3 w-3" />
                                                    {track.duration}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isSelected && (
                                            <div className="h-6 w-6 rounded-full bg-pink-600 flex items-center justify-center mr-2 animate-in zoom-in spin-in-12">
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

      <CreateStepFooter 
        onBack={() => {
            if (audioRef.current) {
                audioRef.current.pause()
                setPlayingTrack(null)
            }
            onBack()
        }}
        onContinue={() => {
            if (audioRef.current) {
                audioRef.current.pause()
                setPlayingTrack(null)
            }
            onNext()
        }}
        canContinue={!!formData.music}
      />
    </div>
  )
}
