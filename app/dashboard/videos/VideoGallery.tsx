"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  Smartphone, 
  Monitor, 
  Square,
  Search,
  VideoOff,
  Mic,
  Type,
  FileText,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { deleteVideoGeneration } from "@/actions/video"
import { toast } from "sonner"
import { VideoPlayerWithCaptions } from "@/components/VideoPlayerWithCaptions"

interface VideoGenerationData {
  _id: string
  prompt: string
  style: string
  duration: number
  aspectRatio: '9:16' | '16:9' | '1:1'
  status: string
  progress?: number
  errorMessage?: string
  outputUrl?: string
  thumbnailUrl?: string
  createdAt: string
  metadata?: {
    niche?: string
    language?: string
    voice?: string
    voiceModel?: string
    music?: string
    captionFont?: string
    captionColor?: string
    captionStyle?: string
    scriptText?: string
    audioDataUrl?: string
    audioBase64?: string
    hasRealAudio?: boolean
    captionWords?: Array<{ word: string; start: number; end: number }>
    captionSegments?: Array<{ text: string; start: number; end: number }>
    hasCaptions?: boolean
  }
}

interface VideoGalleryProps {
  videos: VideoGenerationData[]
}

export function VideoGallery({ videos: initialVideos }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoGenerationData[]>(initialVideos)
  const [selectedVideo, setSelectedVideo] = useState<VideoGenerationData | null>(null)
  const [isPlayOpen, setIsPlayOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this generated video? This action is permanent.")) {
      return
    }

    try {
      const response = await deleteVideoGeneration(id)
      if (response.success) {
        setVideos(prev => prev.filter(v => v._id !== id))
        toast.success("Video deleted successfully!")
      } else {
        toast.error(response.error || "Failed to delete video.")
      }
    } catch (error) {
      toast.error("An error occurred while deleting.")
    }
  }

  const filteredVideos = videos.filter(video => 
    video.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (video.metadata?.niche && video.metadata.niche.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getAspectIcon = (ratio: string) => {
    switch (ratio) {
      case '16:9': return <Monitor className="h-3 w-3 mr-1 inline" />
      case '1:1': return <Square className="h-3 w-3 mr-1 inline" />
      default: return <Smartphone className="h-3 w-3 mr-1 inline" />
    }
  }

  // Download audio as MP3 file
  const handleDownloadAudio = (video: VideoGenerationData) => {
    const audioDataUrl = video.metadata?.audioDataUrl
    if (!audioDataUrl) {
      toast.error("No audio available to download.")
      return
    }
    const a = document.createElement("a")
    a.href = audioDataUrl
    a.download = `narration-${video._id}.mp3`
    a.click()
    toast.success("Audio download started!")
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Your Generations</h2>
          <p className="text-muted-foreground text-sm">Review, download, and manage your AI-generated shorts.</p>
        </div>
        <div className="flex items-center gap-2 max-w-sm w-full bg-background border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by prompt or niche..." 
            className="flex-1 bg-transparent text-sm border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-2 flex flex-col items-center justify-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <VideoOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg font-bold">No Videos Found</CardTitle>
          <CardDescription className="max-w-xs mx-auto mt-2">
            {searchQuery 
              ? "No videos match your search query. Try another keyword!"
              : "You haven't generated any videos yet. Go to Create page to start!"
            }
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const formattedDate = mounted 
              ? new Date(video.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : ""

            const isProcessing = video.status === 'pending' || video.status === 'processing'
            const isFailed = video.status === 'failed'
            const hasAudio = !!video.metadata?.hasRealAudio
            const hasCaptions = !!video.metadata?.hasCaptions

            return (
              <Card key={video._id} className="overflow-hidden border group hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  {/* Thumbnail / Video Wrapper */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img 
                      src={video.thumbnailUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400"} 
                      alt={video.prompt} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Processing overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-xs font-semibold text-center">Generating AI Short...</span>
                        <div className="w-full max-w-[120px] bg-white/20 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${video.progress || 10}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/60 mt-1">{video.progress || 10}%</span>
                      </div>
                    )}

                    {/* Failed overlay */}
                    {isFailed && (
                      <div className="absolute inset-0 bg-destructive/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-20">
                        <span className="text-sm font-bold text-center">Generation Failed</span>
                        <p className="text-[10px] text-white/90 text-center mt-1 line-clamp-3" title={video.errorMessage}>
                          {video.errorMessage || "An unexpected error occurred during rendering."}
                        </p>
                      </div>
                    )}

                    {/* Dark overlay on hover */}
                    {!isProcessing && !isFailed && (
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button 
                          size="sm" 
                          className="shadow"
                          onClick={() => {
                            setSelectedVideo(video)
                            setIsPlayOpen(true)
                          }}
                        >
                          <Play className="h-4 w-4 mr-1 fill-white" /> Preview
                        </Button>
                      </div>
                    )}

                    {/* Badges top left */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <Badge className="bg-slate-900/80 text-white backdrop-blur-sm border-0">
                        {getAspectIcon(video.aspectRatio)}
                        {video.aspectRatio}
                      </Badge>
                      {video.metadata?.niche && (
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground border-0 capitalize">
                          {video.metadata.niche}
                        </Badge>
                      )}
                    </div>

                    {/* AI indicators top right */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {hasAudio && (
                        <Badge className="bg-green-500/90 text-white border-0 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                          <Mic className="h-2.5 w-2.5" /> AI Voice
                        </Badge>
                      )}
                      {hasCaptions && (
                        <Badge className="bg-blue-500/90 text-white border-0 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                          <Type className="h-2.5 w-2.5" /> Captions
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-slate-950/80 text-white backdrop-blur-sm border-0 font-mono text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-1 inline" />
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold line-clamp-1 capitalize" title={video.prompt}>
                      {video.prompt}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-4 py-2 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Style: <span className="font-semibold text-foreground capitalize">{video.style}</span> | 
                      Voice: <span className="font-semibold text-foreground capitalize">{video.metadata?.voice || "Default"}</span> |
                      Lang: <span className="font-semibold text-foreground capitalize">{video.metadata?.language || "en"}</span>
                    </p>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-2 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      disabled={isProcessing || isFailed}
                      onClick={() => {
                        setSelectedVideo(video)
                        setIsPlayOpen(true)
                      }}
                      title="Preview Video"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {hasAudio && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-green-600"
                        disabled={isProcessing || isFailed}
                        onClick={() => handleDownloadAudio(video)}
                        title="Download AI Audio (MP3)"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {!hasAudio && video.outputUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        disabled={isProcessing || isFailed}
                        asChild={!isProcessing && !isFailed}
                        title="Download MP4"
                      >
                        {isProcessing || isFailed ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <a href={video.outputUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(video._id)}
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Video Preview Dialog with Real Audio + Captions */}
      <Dialog open={isPlayOpen} onOpenChange={setIsPlayOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-neutral-950 text-white border-0 shadow-2xl">
          <DialogTitle className="sr-only">Video Preview</DialogTitle>
          <DialogDescription className="sr-only">Play and download generated video with AI voice and captions.</DialogDescription>
          {selectedVideo && (
            <div className="flex flex-col md:flex-row min-h-[400px]">
              {/* Left Column: Video + Audio Player */}
              <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-4 gap-4 border-r border-neutral-900">
                <VideoPlayerWithCaptions
                  audioDataUrl={selectedVideo.metadata?.audioDataUrl || null}
                  videoUrl={selectedVideo.outputUrl}
                  captionWords={selectedVideo.metadata?.captionWords || []}
                  captionSegments={selectedVideo.metadata?.captionSegments || []}
                  captionFont={selectedVideo.metadata?.captionFont || "Impact"}
                  captionColor={selectedVideo.metadata?.captionColor || "#eab308"}
                  captionStyle={(selectedVideo.metadata?.captionStyle as any) || "karaoke"}
                  scriptText={selectedVideo.metadata?.scriptText}
                  aspectRatio={selectedVideo.aspectRatio}
                  title={selectedVideo.prompt}
                />
              </div>

              {/* Right Column: Metadata */}
              <div className="w-full md:w-[260px] p-5 flex flex-col justify-between bg-neutral-900">
                <div className="space-y-4">
                  <div>
                    <Badge className="bg-primary hover:bg-primary border-0 text-[10px] capitalize mb-2">
                      {selectedVideo.metadata?.niche || "Short Video"}
                    </Badge>
                    <h3 className="font-bold text-sm leading-tight line-clamp-3 uppercase" title={selectedVideo.prompt}>
                      {selectedVideo.prompt}
                    </h3>
                  </div>

                  {/* AI Features status */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">AI Features</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${selectedVideo.metadata?.hasRealAudio ? 'text-green-400' : 'text-neutral-600'}`} />
                      <span className={selectedVideo.metadata?.hasRealAudio ? 'text-green-400' : 'text-neutral-600'}>
                        Deepgram TTS Voice
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${selectedVideo.metadata?.hasCaptions ? 'text-blue-400' : 'text-neutral-600'}`} />
                      <span className={selectedVideo.metadata?.hasCaptions ? 'text-blue-400' : 'text-neutral-600'}>
                        Word-level Captions ({selectedVideo.metadata?.captionSegments?.length || 0} segments)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-400">
                    <div>
                      <span className="block font-semibold text-neutral-200">Aspect Ratio:</span>
                      <span className="capitalize">{selectedVideo.aspectRatio}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-neutral-200">Video Style:</span>
                      <span className="capitalize">{selectedVideo.style}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-neutral-200">Voice Over:</span>
                      <span className="capitalize">{selectedVideo.metadata?.voiceModel || selectedVideo.metadata?.voice || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-neutral-200">Background Music:</span>
                      <span className="truncate block capitalize">{selectedVideo.metadata?.music?.split('-')[0] || "N/A"}</span>
                    </div>
                    {selectedVideo.metadata?.scriptText && (
                      <div>
                        <span className="block font-semibold text-neutral-200 mb-1">Script:</span>
                        <p className="text-neutral-400 text-[10px] leading-relaxed line-clamp-5 bg-neutral-800 rounded p-2">
                          {selectedVideo.metadata.scriptText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  {selectedVideo.metadata?.hasRealAudio && (
                    <Button 
                      className="w-full text-xs font-semibold gap-1.5 shadow bg-green-600 hover:bg-green-700" 
                      onClick={() => handleDownloadAudio(selectedVideo)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download AI Voice (MP3)
                    </Button>
                  )}
                  {selectedVideo.outputUrl && (
                    <Button className="w-full text-xs font-semibold gap-1.5 shadow" asChild>
                      <a href={selectedVideo.outputUrl} download={`video-${selectedVideo._id}.mp4`}>
                        <Download className="h-3.5 w-3.5" /> {selectedVideo.outputUrl.startsWith('/rendered-videos/') ? 'Download Rendered Short (MP4)' : 'Download Background Video'}
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full text-xs text-neutral-300 hover:text-white border-neutral-800 hover:bg-neutral-800"
                    onClick={() => setIsPlayOpen(false)}
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
