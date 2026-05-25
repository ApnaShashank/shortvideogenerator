import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Loader2, Music, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AIGeneratorFormProps {
  onAIGenerate: (query: string) => void
  isGeneratingAI: boolean
  lyrics: string
  setLyrics: (lyrics: string) => void
  caption: string
  setCaption: (caption: string) => void
}

export function AIGeneratorForm({
  onAIGenerate,
  isGeneratingAI,
  lyrics,
  setLyrics,
  caption,
  setCaption
}: AIGeneratorFormProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      
      {/* AI Search/Generation Trigger */}
      <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold mb-2">
          <Sparkles className="h-5 w-5" />
          <h2>AI Song & Lyrics Engine</h2>
        </div>
        
        <div className="space-y-2">
          <Label>Find Trending Song or Enter Song Name</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. Tum Se Hi, Phonk drift, Lofi study..." 
                className="pl-9 h-12 bg-background border-primary/20 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="h-12 px-6 font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              disabled={!searchQuery.trim() || isGeneratingAI}
              onClick={() => onAIGenerate(searchQuery)}
            >
              {isGeneratingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : "Magic Fetch"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            AI will auto-fetch the song, extract viral lyrics, and set the perfect mood.
          </p>
        </div>
      </div>

      {/* Editor Sections */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            Extracted Viral Lyrics
          </Label>
          <Textarea 
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="min-h-[120px] font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/20"
            placeholder="AI will paste the best viral lines here..."
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            AI Generated Caption & Hashtags
          </Label>
          <Textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[80px] text-sm resize-none bg-muted/30 focus-visible:ring-primary/20"
            placeholder="AI will generate viral captions here..."
          />
        </div>
      </motion.div>
    </div>
  )
}
