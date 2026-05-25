export const DEEPGRAM_VOICE_MAP: Record<string, string> = {
  'amalthea': 'aura-asteria-en',
  'asteria': 'aura-asteria-en',
  'luna': 'aura-luna-en',
  'stella': 'aura-stella-en',
  'athena': 'aura-athena-en',
  'hera': 'aura-hera-en',
  'orion': 'aura-orion-en',
  'arcas': 'aura-arcas-en',
  'perseus': 'aura-perseus-en',
  'orpheus': 'aura-orpheus-en',
  'helios': 'aura-helios-en',
  'zeus': 'aura-zeus-en',
}

export async function generateScriptWithAI(prompt: string, niche: string, language: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (groqApiKey) {
    try {
      console.log(`[AI] Generating script using Groq llama-3.3-70b-versatile`)
      const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a professional short-form video script writer for platforms like TikTok, Reels, and Shorts. Write a highly engaging narration script. CRITICAL: Only output the actual spoken words. Do NOT include scene descriptions, camera directions, stage directions, bracketed comments like [Music], [Intro], or speaker labels. Just pure narration text, nothing else."
            },
            {
              role: "user",
              content: `Write a short video script about the niche "${niche}". Topic prompt: "${prompt}". The script should be engaging, informative, and fit in a 60-second video (around 100-150 words). Language: ${language || 'english'}.`
            }
          ]
        })
      })

      const apiData = await apiResponse.json()
      if (apiData.choices?.[0]?.message?.content) {
        return apiData.choices[0].message.content.trim()
      }
      console.error('Groq API error response:', apiData)
    } catch (err) {
      console.error('Error fetching Groq completion:', err)
    }
  }

  if (!openRouterKey) {
    return `Welcome back! Today we explore the fascinating world of ${niche}. Let's dive right in.`
  }

  try {
    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "LyricsFlow AI"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional short-form video script writer for platforms like TikTok, Reels, and Shorts. Write a highly engaging narration script. CRITICAL: Only output the actual spoken words. Do NOT include scene descriptions, camera directions, stage directions, bracketed comments like [Music], [Intro], or speaker labels. Just pure narration text, nothing else."
          },
          {
            role: "user",
            content: `Write a short video script about the niche "${niche}". Topic prompt: "${prompt}". The script should be engaging, informative, and fit in a 60-second video (around 100-150 words). Language: ${language || 'english'}.`
          }
        ]
      })
    })

    const apiData = await apiResponse.json()
    if (apiData.choices?.[0]?.message?.content) {
      return apiData.choices[0].message.content.trim()
    }
    console.error('OpenRouter API error response:', apiData)
    return `Did you know that ${niche} has some incredible secrets? Watch till the end to find out more. Like and follow for daily daily facts!`
  } catch (err) {
    console.error('Error fetching OpenRouter completion:', err)
    return `Welcome back! Today we are exploring the fascinating world of ${niche}. Let's dive right in.`
  }
}

export async function generateVoiceWithDeepgram(
  text: string,
  voiceKey: string
): Promise<{ audioBase64: string; durationSeconds: number } | null> {
  const deepgramKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramKey) {
    console.warn('[Generate] No DEEPGRAM_API_KEY configured, skipping TTS')
    return null
  }

  const voiceModel = DEEPGRAM_VOICE_MAP[voiceKey?.toLowerCase()] || 'aura-asteria-en'
  const cleanText = text.trim().slice(0, 3000)

  try {
    console.log(`[Generate] Calling Deepgram TTS: model=${voiceModel}, chars=${cleanText.length}`)

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
      console.error('[Generate] Deepgram TTS failed:', deepgramRes.status, errText)
      return null
    }

    const audioBuffer = await deepgramRes.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // Estimate duration
    const wordCount = cleanText.split(/\s+/).length
    const estimatedDurationSecs = Math.ceil((wordCount / 130) * 60)

    console.log(`[Generate] TTS success: ${audioBuffer.byteLength} bytes, ~${estimatedDurationSecs}s`)
    return { audioBase64, durationSeconds: estimatedDurationSecs }
  } catch (err) {
    console.error('[Generate] Deepgram TTS error:', err)
    return null
  }
}

export async function generateCaptionsWithDeepgram(
  audioBase64: string
): Promise<{ words: any[]; segments: any[] } | null> {
  const deepgramKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramKey) return null

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    console.log(`[Generate] Calling Deepgram STT for captions: ${audioBuffer.byteLength} bytes`)

    const deepgramRes = await fetch(
      'https://api.deepgram.com/v1/listen?' +
      new URLSearchParams({
        model: 'nova-2',
        punctuate: 'true',
        words: 'true',
        smart_format: 'true',
        language: 'en-US',
      }),
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': 'audio/mp3',
        },
        body: audioBuffer,
      }
    )

    if (!deepgramRes.ok) {
      console.error('[Generate] Deepgram STT failed:', deepgramRes.status)
      return null
    }

    const data = await deepgramRes.json()
    const channel = data?.results?.channels?.[0]?.alternatives?.[0]

    if (!channel) return null

    const words = (channel.words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    }))

    // Group into 4-word caption segments
    const WORDS_PER_SEGMENT = 4
    const segments: Array<{ text: string; start: number; end: number }> = []
    for (let i = 0; i < words.length; i += WORDS_PER_SEGMENT) {
      const chunk = words.slice(i, i + WORDS_PER_SEGMENT)
      if (!chunk.length) continue
      segments.push({
        text: chunk.map((w: any) => w.word).join(' '),
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      })
    }

    console.log(`[Generate] Captions success: ${words.length} words, ${segments.length} segments`)
    return { words, segments }
  } catch (err) {
    console.error('[Generate] Deepgram captions error:', err)
    return null
  }
}
