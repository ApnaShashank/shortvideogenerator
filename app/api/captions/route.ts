import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// This route accepts an audio file (as base64) and returns word-level timestamps
// from Deepgram's speech-to-text API — used for building karaoke-style captions

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { audioBase64, mimeType = 'audio/mp3' } = await req.json()

    if (!audioBase64) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 })
    }

    const deepgramKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramKey) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    // Convert base64 back to binary buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    console.log(`[Captions] Transcribing ${audioBuffer.byteLength} bytes of audio`)

    // Call Deepgram STT API with word-level timestamps
    const deepgramRes = await fetch(
      'https://api.deepgram.com/v1/listen?' +
      new URLSearchParams({
        model: 'nova-2',
        punctuate: 'true',
        utterances: 'true',
        words: 'true',        // Enables word-level timestamps
        smart_format: 'true',
        language: 'en-US',
      }),
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': mimeType,
        },
        body: audioBuffer,
      }
    )

    if (!deepgramRes.ok) {
      const errText = await deepgramRes.text()
      console.error('[Captions] Deepgram STT error:', deepgramRes.status, errText)
      return NextResponse.json(
        { error: `Deepgram transcription failed: ${deepgramRes.statusText}` },
        { status: 500 }
      )
    }

    const data = await deepgramRes.json()
    const channel = data?.results?.channels?.[0]?.alternatives?.[0]

    if (!channel) {
      return NextResponse.json({ error: 'No transcription data returned' }, { status: 500 })
    }

    const fullTranscript = channel.transcript || ''
    const words: Array<{ word: string; start: number; end: number; confidence: number }> =
      (channel.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,   // seconds
        end: w.end,       // seconds
        confidence: w.confidence,
      }))

    // Group words into caption segments (3-5 words per line)
    const segments: Array<{ text: string; start: number; end: number }> = []
    const WORDS_PER_SEGMENT = 4

    for (let i = 0; i < words.length; i += WORDS_PER_SEGMENT) {
      const chunk = words.slice(i, i + WORDS_PER_SEGMENT)
      if (chunk.length === 0) continue
      segments.push({
        text: chunk.map(w => w.word).join(' '),
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      })
    }

    console.log(`[Captions] Success: ${words.length} words, ${segments.length} segments`)

    return NextResponse.json({
      transcript: fullTranscript,
      words,
      segments,
      duration: data?.metadata?.duration || 0,
    })

  } catch (error: any) {
    console.error('[Captions] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Caption generation failed' },
      { status: 500 }
    )
  }
}
