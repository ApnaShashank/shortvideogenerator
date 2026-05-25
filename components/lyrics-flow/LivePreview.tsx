import React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LivePreviewProps {
  themeStyle: {
    background: string
    color: string
    fontFamily: string
  }
  lyricsText: string
  isPlaying: boolean
  onTogglePlay: () => void
  fontSize: number
  lineSpacing: number
}

export function LivePreview({
  themeStyle,
  lyricsText,
  isPlaying,
  onTogglePlay,
  fontSize,
  lineSpacing
}: LivePreviewProps) {
  
  const lines = lyricsText.split('\n')

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl rounded-[40px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      
      <div 
        className="w-full aspect-[9/16] rounded-[32px] border-[8px] border-slate-900/90 shadow-2xl relative overflow-hidden flex flex-col justify-center items-center transition-all duration-700 ease-in-out"
        style={{ background: themeStyle.background }}
      >
        {/* Equalizer animation when playing */}
        {isPlaying && (
          <div className="absolute top-6 right-6 flex items-end gap-[3px] h-6 w-8 opacity-80">
            <span className="w-[3px] bg-current animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '0.1s', backgroundColor: themeStyle.color }} />
            <span className="w-[3px] bg-current h-5 animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '0.3s', backgroundColor: themeStyle.color }} />
            <span className="w-[3px] bg-current h-3 animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '0.5s', backgroundColor: themeStyle.color }} />
            <span className="w-[3px] bg-current h-4 animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '0.2s', backgroundColor: themeStyle.color }} />
          </div>
        )}

        {/* Animated Lyrics */}
        <div 
          className="px-8 text-center whitespace-pre-wrap font-bold uppercase tracking-widest leading-relaxed z-10 w-full flex flex-col justify-center items-center"
          style={{
            color: themeStyle.color,
            fontFamily: themeStyle.fontFamily,
          }}
        >
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
              style={{
                fontSize: `${fontSize}px`,
                marginBottom: `${lineSpacing}px`
              }}
            >
              {line}
            </motion.div>
          ))}
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-6 flex items-center justify-center w-full z-20">
          <Button 
            size="icon" 
            variant="secondary"
            className="rounded-full h-14 w-14 bg-black/20 hover:bg-black/40 backdrop-blur-xl text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] border border-white/20 transition-transform hover:scale-105 active:scale-95"
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
        </div>
      </div>
      
      {/* Decorative base */}
      <div className="h-2 w-32 bg-slate-900/10 rounded-full mt-6 blur-sm"></div>
    </div>
  )
}
