import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ThemePreset {
  id: string
  name: string
  background: string
  color: string
  fontFamily: string
}

export const THEMES: ThemePreset[] = [
  { id: 'minimal-dark', name: 'Minimal Dark', background: 'linear-gradient(to bottom, #0f172a, #020617)', color: '#ffffff', fontFamily: 'Inter, sans-serif' },
  { id: 'aesthetic-beige', name: 'Aesthetic Beige', background: 'linear-gradient(to bottom, #f5f5dc, #e8e4c9)', color: '#4a4a4a', fontFamily: 'Montserrat, sans-serif' },
  { id: 'vintage-film', name: 'Vintage Film', background: 'linear-gradient(to bottom, #3b2f2f, #1e1313)', color: '#eab308', fontFamily: 'Inter, sans-serif' },
  { id: 'anime-vibe', name: 'Anime Vibe', background: 'linear-gradient(to bottom, #fbcfe8, #be185d)', color: '#ffffff', fontFamily: 'Bangers, Impact' },
  { id: 'bhojpuri-folk', name: 'Bhojpuri Folk', background: 'linear-gradient(to bottom, #fef08a, #ea580c)', color: '#7f1d1d', fontFamily: 'Caveat, cursive' },
  { id: 'romantic-sunset', name: 'Romantic', background: 'linear-gradient(to bottom, #fca5a5, #7e22ce)', color: '#ffffff', fontFamily: 'Caveat, cursive' },
  { id: 'luxury-gold', name: 'Luxury Gold', background: 'linear-gradient(to bottom, #171717, #0a0a0a)', color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' },
]

interface ThemeSelectorProps {
  selectedThemeId: string
  onSelectTheme: (theme: ThemePreset) => void
}

export function ThemeSelector({ selectedThemeId, onSelectTheme }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Select Aesthetic Theme</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {THEMES.map((theme, i) => {
          const isSelected = selectedThemeId === theme.id
          
          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectTheme(theme)}
              className={cn(
                "relative h-24 rounded-xl flex flex-col justify-end p-3 overflow-hidden text-left transition-all duration-300",
                isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]" : "hover:scale-[1.02] border border-border/50"
              )}
            >
              <div 
                className="absolute inset-0 z-0 transition-transform duration-700"
                style={{ background: theme.background }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              
              <span className="relative z-20 font-medium text-xs text-white uppercase tracking-wider truncate drop-shadow-md">
                {theme.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
