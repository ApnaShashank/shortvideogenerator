"use client"

import React, { useRef, useState, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CaptionWord {
  word: string
  start: number
  end: number
}

interface CaptionSegment {
  text: string
  start: number
  end: number
}

interface VideoPlayerWithCaptionsProps {
  audioDataUrl?: string | null
  videoUrl?: string | null
  captionWords?: CaptionWord[]
  captionSegments?: CaptionSegment[]
  captionFont?: string
  captionColor?: string
  captionStyle?: "karaoke" | "classic" | "zoom"
  scriptText?: string
  aspectRatio?: "9:16" | "16:9" | "1:1"
  title?: string
  className?: string
}

export function VideoPlayerWithCaptions({
  audioDataUrl,
  videoUrl,
  captionWords = [],
  captionSegments = [],
  captionFont = "Impact",
  captionColor = "#eab308",
  captionStyle = "karaoke",
  scriptText,
  aspectRatio = "9:16",
  title,
  className,
}: VideoPlayerWithCaptionsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)

  const isRendered = videoUrl ? videoUrl.startsWith('/rendered-videos/') : false

  // Sync time from audio or video element
  const syncTime = () => {
    const media = isRendered ? videoRef.current : audioRef.current
    if (!media) return
    const t = media.currentTime
    setCurrentTime(t)

    if (!isRendered) {
      // Find active caption segment
      const segIdx = captionSegments.findIndex((s) => t >= s.start && t <= s.end)
      setCurrentSegmentIndex(segIdx)

      // Find active word
      const wordIdx = captionWords.findIndex((w) => t >= w.start && t <= w.end)
      setCurrentWordIndex(wordIdx)
    }

    if (!media.paused) {
      animFrameRef.current = requestAnimationFrame(syncTime)
    }
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const handlePlayPause = () => {
    const audio = audioRef.current
    const video = videoRef.current

    if (isRendered) {
      if (!video) return
      if (isPlaying) {
        video.pause()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setIsPlaying(false)
      } else {
        video.play()
        animFrameRef.current = requestAnimationFrame(syncTime)
        setIsPlaying(true)
      }
    } else {
      if (!audio) return
      if (isPlaying) {
        audio.pause()
        video?.pause()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setIsPlaying(false)
      } else {
        audio.play()
        video?.play()
        animFrameRef.current = requestAnimationFrame(syncTime)
        setIsPlaying(true)
      }
    }
  }

  const handleMuteToggle = () => {
    if (isRendered) {
      const video = videoRef.current
      if (!video) return
      video.muted = !video.muted
      setIsMuted(video.muted)
    } else {
      const audio = audioRef.current
      if (!audio) return
      audio.muted = !audio.muted
      setIsMuted(audio.muted)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setCurrentSegmentIndex(-1)
    setCurrentWordIndex(-1)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }

  const handleDownloadAudio = () => {
    if (!audioDataUrl) return
    const a = document.createElement("a")
    a.href = audioDataUrl
    a.download = `${title || "narration"}.mp3`
    a.click()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const containerClass = cn(
    "relative overflow-hidden rounded-xl bg-black flex items-center justify-center",
    aspectRatio === "9:16" && "max-w-[280px] aspect-[9/16]",
    aspectRatio === "16:9" && "w-full aspect-video",
    aspectRatio === "1:1" && "max-w-[320px] aspect-square",
    className
  )

  // Get the active segment's words for karaoke highlight
  const activeSegment = !isRendered && currentSegmentIndex >= 0 ? captionSegments[currentSegmentIndex] : null
  const segmentWords = activeSegment
    ? activeSegment.text.split(" ")
    : []

  // Find which word in the current segment is active
  let activeWordInSegment = -1
  if (activeSegment) {
    const segStart = captionSegments
      .slice(0, currentSegmentIndex)
      .reduce((acc, s) => acc + s.text.split(" ").length, 0)
    activeWordInSegment = currentWordIndex - segStart
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Video/Animation container */}
      <div className={containerClass}>
        {/* Background video */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            loop={!isRendered}
            muted={!isRendered ? true : isMuted}
            playsInline
            onLoadedMetadata={() => {
              if (isRendered) {
                setDuration(videoRef.current?.duration || 0)
              }
            }}
            onEnded={() => {
              if (isRendered) {
                setIsPlaying(false)
                setCurrentTime(0)
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
              }
            }}
            className={cn("absolute inset-0 w-full h-full object-cover", !isRendered ? "opacity-60" : "opacity-100")}
          />
        )}

        {/* Dark overlay */}
        {!isRendered && <div className="absolute inset-0 bg-black/30" />}

        {/* Hidden audio element for Deepgram TTS */}
        {audioDataUrl && !isRendered && (
          <audio
            ref={audioRef}
            src={audioDataUrl}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={handleAudioEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {/* Captions overlay */}
        {!isRendered && (
          <div className="absolute bottom-14 left-2 right-2 text-center pointer-events-none">
            {captionStyle === "karaoke" && activeSegment && (
              <div
                className="flex flex-wrap justify-center gap-x-1 gap-y-0.5"
                style={{ fontFamily: captionFont }}
              >
                {segmentWords.map((word, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-xl font-black uppercase transition-all duration-75",
                      i === activeWordInSegment
                        ? "scale-110"
                        : "text-white"
                    )}
                    style={{
                      color: i === activeWordInSegment ? captionColor : "#ffffff",
                      textShadow:
                        "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            {captionStyle === "classic" && activeSegment && (
              <p
                className="text-xl font-black uppercase leading-tight"
                style={{
                  fontFamily: captionFont,
                  color: captionColor,
                  textShadow:
                    "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                }}
              >
                {activeSegment.text}
              </p>
            )}

            {captionStyle === "zoom" && activeSegment && (
              <p
                className="text-2xl font-black uppercase leading-tight animate-pulse"
                style={{
                  fontFamily: captionFont,
                  color: captionColor,
                  textShadow:
                    "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                }}
              >
                {activeSegment.text}
              </p>
            )}

            {/* Fallback: show script text if no captions */}
            {captionSegments.length === 0 && scriptText && (
              <p
                className="text-lg font-black uppercase leading-tight"
                style={{
                  fontFamily: captionFont,
                  color: captionColor,
                  textShadow:
                    "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                }}
              >
                {scriptText.slice(0, 60)}...
              </p>
            )}
          </div>
        )}

        {/* Play button overlay */}
        {!isPlaying && (audioDataUrl || isRendered) && (
          <button
            onClick={handlePlayPause}
            className="relative z-10 h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
          >
            <Play className="h-7 w-7 text-white ml-1" />
          </button>
        )}

        {/* No audio/video fallback */}
        {!audioDataUrl && !isRendered && (
          <div className="relative z-10 text-center text-white/60 px-4">
            <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Preview unavailable</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      {(audioDataUrl || isRendered) && (
        <div className="flex items-center gap-2 w-full max-w-[320px]">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </Button>

          {/* Progress bar */}
          <div
            className="flex-1 h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              if (isRendered && videoRef.current) {
                videoRef.current.currentTime = pct * duration
              } else if (audioRef.current) {
                audioRef.current.currentTime = pct * duration
              }
            }}
          >
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {Math.floor(currentTime)}s / {Math.floor(duration)}s
          </span>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={handleMuteToggle}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>

          {isRendered ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              asChild
              title="Download merged video"
            >
              <a href={videoUrl!} download={`${title || "video"}.mp4`}>
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            audioDataUrl && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleDownloadAudio}
                title="Download audio"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
