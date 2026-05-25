import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Deepgram Aura voice models available
// English voices: aura-asteria-en, aura-luna-en, aura-stella-en, aura-athena-en,
//                 aura-hera-en, aura-orion-en, aura-arcas-en, aura-perseus-en,
//                 aura-angus-en, aura-orpheus-en, aura-helios-en, aura-zeus-en
// Hindi support via aura-2-thalia-en (general multilingual) - best effort

const VOICE_MAP: Record<string, string> = {
  // Female English
  'amalthea': 'aura-asteria-en',
  'asteria': 'aura-asteria-en',
  'luna': 'aura-luna-en',
  'stella': 'aura-stella-en',
  'athena': 'aura-athena-en',
  'hera': 'aura-hera-en',
  // Male English
  'orion': 'aura-orion-en',
  'arcas': 'aura-arcas-en',
  'perseus': 'aura-perseus-en',
  'angus': 'aura-angus-en',
  'orpheus': 'aura-orpheus-en',
  'helios': 'aura-helios-en',
  'zeus': 'aura-zeus-en',
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, voice, language } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required for TTS' }, { status: 400 })
    }

    const deepgramKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramKey) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    // Map voice name to Deepgram model
    const voiceModel = VOICE_MAP[voice?.toLowerCase()] || 'aura-asteria-en'

    // Truncate very long scripts (Deepgram TTS has limits)
    const cleanText = text.trim().slice(0, 3000)

    console.log(`[TTS] Generating audio for ${cleanText.length} chars, voice: ${voiceModel}`)

    // Call Deepgram TTS API
    const deepgramRes = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voiceModel}&encoding=mp3&container=mp3`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      }
    )

    if (!deepgramRes.ok) {
      const errText = await deepgramRes.text()
      console.error('[TTS] Deepgram error:', deepgramRes.status, errText)
      return NextResponse.json(
        { error: `Deepgram TTS failed: ${deepgramRes.statusText}` },
        { status: 500 }
      )
    }

    // Get the audio binary response
    const audioBuffer = await deepgramRes.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`

    // Estimate duration based on word count (avg 130 words/min for speech)
    const wordCount = cleanText.split(/\s+/).length
    const estimatedDurationSecs = Math.ceil((wordCount / 130) * 60)

    console.log(`[TTS] Success: ${audioBuffer.byteLength} bytes, ~${estimatedDurationSecs}s`)

    return NextResponse.json({
      audioDataUrl,
      audioBase64,
      durationSeconds: estimatedDurationSecs,
      wordCount,
      voiceModel,
      textLength: cleanText.length,
    })

  } catch (error: any) {
    console.error('[TTS] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'TTS generation failed' },
      { status: 500 }
    )
  }
}
