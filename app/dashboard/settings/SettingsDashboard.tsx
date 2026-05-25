"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { saveProjectSettings } from "@/actions/settings"
import { connectPlatformMock, disconnectPlatformMock } from "@/actions/connections"
import { toast } from "sonner"
import { 
  Loader2, 
  Settings, 
  Palette, 
  Youtube, 
  Check, 
  Plus, 
  Trash2, 
  Link2 
} from "lucide-react"

interface PlatformConnectionData {
  _id: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'email'
  platformUserName?: string
  profilePicture?: string
  isActive: boolean
}

interface SettingsDashboardProps {
  initialSettings?: {
    name: string
    description: string
    brandColor: string
    logoUrl: string
    watermarkUrl: string
  }
  initialConnections: PlatformConnectionData[]
}

export function SettingsDashboard({ initialSettings, initialConnections }: SettingsDashboardProps) {
  const [formData, setFormData] = useState({
    name: initialSettings?.name || "My Short Video Channel",
    description: initialSettings?.description || "Automated short video uploads.",
    brandColor: initialSettings?.brandColor || "#3b82f6",
    logoUrl: initialSettings?.logoUrl || "",
    watermarkUrl: initialSettings?.watermarkUrl || ""
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [connections, setConnections] = useState<PlatformConnectionData[]>(initialConnections)
  
  // YouTube mock modal states
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false)
  const [youtubeChannelName, setYoutubeChannelName] = useState("")
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await saveProjectSettings(formData)
      if (response.success) {
        toast.success("Branding settings saved successfully!")
      } else {
        toast.error(response.error || "Failed to save settings.")
      }
    } catch (error) {
      toast.error("An error occurred while saving.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectYoutube = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeChannelName.trim()) {
      toast.error("Please enter a valid channel name.")
      return
    }

    setIsConnectingYoutube(true)
    try {
      const response = await connectPlatformMock('youtube', youtubeChannelName)
      if (response.success) {
        toast.success(`Successfully connected YouTube Channel: ${youtubeChannelName}`)
        
        // Add new connection or update existing in UI state
        setConnections(prev => {
          const filtered = prev.filter(c => c.platform !== 'youtube')
          return [...filtered, response.connection as PlatformConnectionData]
        })
        
        setYoutubeChannelName("")
        setIsYoutubeModalOpen(false)
      } else {
        toast.error(response.error || "Failed to connect YouTube channel.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    } finally {
      setIsConnectingYoutube(false)
    }
  }

  const handleDisconnect = async (id: string, platformName: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${platformName} channel?`)) {
      return
    }

    try {
      const response = await disconnectPlatformMock(id)
      if (response.success) {
        setConnections(prev => prev.filter(c => c._id !== id))
        toast.success(`Successfully disconnected ${platformName} channel.`)
      } else {
        toast.error(response.error || "Failed to disconnect platform.")
      }
    } catch (err) {
      toast.error("An error occurred during disconnection.")
    }
  }

  const youtubeConnection = connections.find(c => c.platform === 'youtube')

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* 1. Branding Settings */}
      <form onSubmit={handleSubmit}>
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Brand Configurations
            </CardTitle>
            <CardDescription>Configure your default video branding, logo assets, and watermark details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="channel-name" className="font-semibold text-sm">Channel / Series Name</Label>
              <Input 
                id="channel-name" 
                placeholder="e.g. Daily Motivation Shorts" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="channel-desc" className="font-semibold text-sm">Description</Label>
              <Textarea 
                id="channel-desc" 
                placeholder="A brief description of this channel theme..." 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <Label htmlFor="brand-color" className="font-semibold text-sm flex items-center gap-1.5">
                <Palette className="h-4 w-4" /> Primary Subtitle Color
              </Label>
              <div className="flex gap-3 items-center">
                <Input 
                  id="brand-color" 
                  type="color" 
                  className="w-12 h-10 p-1 border rounded-lg cursor-pointer"
                  value={formData.brandColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandColor: e.target.value }))}
                />
                <Input 
                  type="text" 
                  className="max-w-[150px] font-mono text-sm"
                  value={formData.brandColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandColor: e.target.value }))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">This color will be used by default for subtitle highlighting.</p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo-url" className="font-semibold text-sm">Default Logo Image URL</Label>
              <Input 
                id="logo-url" 
                placeholder="https://example.com/logo.png" 
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              />
            </div>

            {/* Watermark URL */}
            <div className="space-y-2">
              <Label htmlFor="watermark-url" className="font-semibold text-sm">Overlay Watermark Text or Image URL</Label>
              <Input 
                id="watermark-url" 
                placeholder="e.g. @LyricsFlowAI" 
                value={formData.watermarkUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, watermarkUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Watermark overlayed at the corner of generated videos to prevent piracy.</p>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 border-t flex justify-end">
            <Button type="submit" disabled={isSaving} className="shadow">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Save Branding Setup
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* 2. Connected Social Channels */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Connected Channels
          </CardTitle>
          <CardDescription>Authorize LyricsFlow AI to automatically publish generated short videos directly to your channels.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <Youtube className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">YouTube Shorts Channel</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {youtubeConnection 
                    ? `Connected to: ${youtubeConnection.platformUserName}` 
                    : "No YouTube Channel connected."
                  }
                </p>
              </div>
            </div>

            {youtubeConnection ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  <Check className="h-3.5 w-3.5 mr-1" /> Linked
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDisconnect(youtubeConnection._id, 'YouTube')}
                  title="Disconnect Channel"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setIsYoutubeModalOpen(true)} className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Connect Channel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* YouTube Mock OAuth Dialog */}
      <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect YouTube Channel</DialogTitle>
            <DialogDescription>
              Link your YouTube Channel to authorize auto-scheduling and auto-publishing of Shorts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectYoutube} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="youtube-channel-name">YouTube Channel Name</Label>
              <Input 
                id="youtube-channel-name" 
                placeholder="e.g. Shashank Tech & Gaming" 
                value={youtubeChannelName}
                onChange={(e) => setYoutubeChannelName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsYoutubeModalOpen(false)}
                disabled={isConnectingYoutube}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isConnectingYoutube}
                className="gap-1.5"
              >
                {isConnectingYoutube && <Loader2 className="h-4 w-4 animate-spin" />}
                Authorize & Connect (Simulation)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
