import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

// 1. Helper to fetch official lyrics using Spotify, Musixmatch, or Genius RapidAPI endpoints
async function fetchOfficialLyrics(query: string): Promise<{ lyrics: string; songName: string; artistName: string } | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  if (!rapidApiKey) {
    console.warn(`[Lyrics Fetch] No RAPIDAPI_KEY configured. Skipping RapidAPI lyrics lookup.`)
    return null
  }

  try {
    // A. Search Spotify for track ID
    console.log(`[Lyrics Fetch] Searching Spotify for track: "${query}"`)
    const searchUrl = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(query)}&type=tracks&offset=0&limit=1`
    const searchRes = await fetch(searchUrl, {
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'spotify23.p.rapidapi.com'
      }
    })

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      const item = searchData.tracks?.items?.[0]
      if (item) {
        const trackId = item.id || item.data?.id || (item.uri && item.uri.split(':').pop())
        const songName = item.name || item.data?.name || query
        const artistName = item.artists?.[0]?.name || item.data?.artists?.items?.[0]?.profile?.name || ""

        if (trackId) {
          console.log(`[Lyrics Fetch] Found Spotify Track: "${songName}" by "${artistName}" (ID: ${trackId})`)
          
          // B. Try Spotify Track Lyrics endpoint
          try {
            console.log(`[Lyrics Fetch] Fetching Spotify track lyrics for ID: ${trackId}`)
            const lyricsUrl = `https://spotify23.p.rapidapi.com/track_lyrics/?id=${trackId}`
            const lyricsRes = await fetch(lyricsUrl, {
              headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'spotify23.p.rapidapi.com'
              }
            })

            if (lyricsRes.ok) {
              const lyricsData = await lyricsRes.json()
              const lines = lyricsData.lyrics?.lines
              if (lines && lines.length > 0) {
                const lyricsText = lines.map((l: any) => l.words || l.text).filter(Boolean).join('\n')
                if (lyricsText.trim()) {
                  console.log(`[Lyrics Fetch] Successfully fetched lyrics from Spotify API!`)
                  return { lyrics: lyricsText, songName, artistName }
                }
              }
            }
          } catch (spotifyErr: any) {
            console.error(`[Lyrics Fetch] Spotify track lyrics failed:`, spotifyErr.message)
          }

          // C. Try Musixmatch Lyrics endpoint as fallback
          try {
            console.log(`[Lyrics Fetch] Fetching Musixmatch lyrics for Spotify Track ID: ${trackId}`)
            const musixUrl = `https://musixmatch-lyrics-songs.p.rapidapi.com/spotify/lyrics?track_id=${trackId}`
            const musixRes = await fetch(musixUrl, {
              headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'musixmatch-lyrics-songs.p.rapidapi.com'
              }
            })

            if (musixRes.ok) {
              const musixData = await musixRes.json()
              const lyricsText = musixData.lyrics || musixData.lyrics_body || musixData.lyrics?.lyrics_body
              if (lyricsText && lyricsText.trim()) {
                console.log(`[Lyrics Fetch] Successfully fetched lyrics from Musixmatch API!`)
                return { lyrics: lyricsText, songName, artistName }
              }
            }
          } catch (musixErr: any) {
            console.error(`[Lyrics Fetch] Musixmatch lyrics failed:`, musixErr.message)
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`[Lyrics Fetch] Spotify/Musixmatch search failed:`, error.message)
  }

  // D. Try Genius Search & Scraper endpoint if Spotify search fails or yields no results
  try {
    console.log(`[Lyrics Fetch] Searching Genius: "${query}"`)
    const geniusSearchUrl = `https://genius-song-lyrics1.p.rapidapi.com/search/?q=${encodeURIComponent(query)}`
    const geniusRes = await fetch(geniusSearchUrl, {
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'genius-song-lyrics1.p.rapidapi.com'
      }
    })

    if (geniusRes.ok) {
      const geniusData = await geniusRes.json()
      const hit = geniusData.hits?.[0]
      if (hit && hit.result) {
        const songName = hit.result.title || query
        const artistName = hit.result.primary_artist?.name || ""
        const lyricsPageUrl = hit.result.url

        if (lyricsPageUrl) {
          console.log(`[Lyrics Fetch] Scrapping Genius Lyrics Page: ${lyricsPageUrl}`)
          const pageRes = await fetch(lyricsPageUrl)
          if (pageRes.ok) {
            const html = await pageRes.text()
            const cleanHtml = html.replace(/<br\s*\/?>/gi, '\n')
            
            // Search inside Lyrics__Container divs
            const containerRegex = /class="Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/g
            let match;
            let lyricsText = ""
            while ((match = containerRegex.exec(cleanHtml)) !== null) {
              const text = match[1].replace(/<[^>]*>/g, '').trim()
              if (text) lyricsText += text + '\n'
            }

            // Fallback for older Genius templates
            if (!lyricsText.trim()) {
              const oldRegex = /<div class="lyrics"[^>]*>([\s\S]*?)<\/div>/g
              const oldMatch = oldRegex.exec(cleanHtml)
              if (oldMatch) {
                lyricsText = oldMatch[1].replace(/<[^>]*>/g, '').trim()
              }
            }

            if (lyricsText.trim()) {
              console.log(`[Lyrics Fetch] Successfully scraped Genius lyrics!`)
              return { lyrics: lyricsText, songName, artistName }
            }
          }
        }
      }
    }
  } catch (geniusErr: any) {
    console.error(`[Lyrics Fetch] Genius lookup failed:`, geniusErr.message)
  }

  return null
}

// 2. Helper to execute AI Completions with Multi-Model / Multi-Key Fallbacks
async function callAIChatCompletions(systemPrompt: string, userPrompt: string): Promise<any> {
  const groqApiKey = process.env.GROQ_API_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY

  const errors: string[] = []

  // Layer 1: Groq API with Llama-3.3-70b-versatile
  if (groqApiKey) {
    try {
      console.log(`[AI Fallback] Attempting Groq (llama-3.3-70b-versatile)...`)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) return JSON.parse(text.trim())
      }
      const errText = await res.text()
      errors.push(`Groq Llama-3.3 failed (status ${res.status}): ${errText}`)
    } catch (e: any) {
      errors.push(`Groq Llama-3.3 error: ${e.message}`)
    }
  }

  // Layer 2: Groq API with Mixtral-8x7b-32768
  if (groqApiKey) {
    try {
      console.log(`[AI Fallback] Attempting Groq Mixtral (mixtral-8x7b-32768)...`)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) return JSON.parse(text.trim())
      }
      const errText = await res.text()
      errors.push(`Groq Mixtral failed (status ${res.status}): ${errText}`)
    } catch (e: any) {
      errors.push(`Groq Mixtral error: ${e.message}`)
    }
  }

  // Layer 3: OpenRouter API with Gemini-2.5-Flash
  if (openRouterKey) {
    try {
      console.log(`[AI Fallback] Attempting OpenRouter (google/gemini-2.5-flash)...`)
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) {
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
          return JSON.parse(cleanText)
        }
      }
      const errText = await res.text()
      errors.push(`OpenRouter Gemini-2.5 failed (status ${res.status}): ${errText}`)
    } catch (e: any) {
      errors.push(`OpenRouter Gemini-2.5 error: ${e.message}`)
    }
  }

  // Layer 4: OpenRouter API with Llama-3-8b-instruct
  if (openRouterKey) {
    try {
      console.log(`[AI Fallback] Attempting OpenRouter (meta-llama/llama-3-8b-instruct)...`)
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "LyricsFlow AI"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) {
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
          return JSON.parse(cleanText)
        }
      }
      const errText = await res.text()
      errors.push(`OpenRouter Llama-3-8b failed (status ${res.status}): ${errText}`)
    } catch (e: any) {
      errors.push(`OpenRouter Llama-3-8b error: ${e.message}`)
    }
  }

  throw new Error(`All LLM models in the fallback chain failed:\n${errors.join('\n')}`)
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    console.log(`[AI Lyrics] Initiating advanced fetch pipeline for: "${query}"`)

    // 1. Try to search and retrieve official lyrics
    const officialDetails = await fetchOfficialLyrics(query)
    
    let lyricsSource = ""
    let songName = query
    let artistName = ""

    if (officialDetails) {
      lyricsSource = officialDetails.lyrics
      songName = officialDetails.songName
      artistName = officialDetails.artistName
      console.log(`[AI Lyrics] Found official lyrics. Characters: ${lyricsSource.length}`)
    }

    // 2. Prepare system instructions based on whether we found the source lyrics
    let systemPrompt = ""
    let userPrompt = ""

    if (lyricsSource) {
      systemPrompt = `You are an expert music curator for LyricsFlow AI.
We have successfully retrieved the official lyrics for the song: "${songName}" by "${artistName}".
Your job is to read these lyrics and select a short, emotionally resonant, and viral snippet of 3-4 lines maximum.
Format guidelines:
- The snippet must consist of exactly 3-4 lines, separated by newlines.
- It must be in UPPERCASE.
- Do not include brackets, artist markers, chorus/verse indicators, etc.
- Recommend one visual theme ID from: 'minimal-dark', 'aesthetic-beige', 'vintage-film', 'anime-vibe', 'bhojpuri-folk', 'romantic-sunset', 'luxury-gold'.
- Generate a highly engaging and viral Instagram caption with emojis and trending hashtags.

Return a valid JSON object ONLY, with the keys: "lyrics", "themeId", "caption". Do not include any markdown format or extra text.
Example structure:
{
  "lyrics": "TUM SE HI DIN HOTA HAI\\nSURMAYI SHAAM AATI HAI\\nTUM SE HI TUM SE HI",
  "themeId": "romantic-sunset",
  "caption": "Late night drive with this track 🎧❤️\\n\\n#tumsehi #aesthetic #lofi #reels #vibes"
}`
      userPrompt = `Official Lyrics Source:\n${lyricsSource}`
    } else {
      systemPrompt = `You are a music curator and lyrics designer for LyricsFlow AI.
The user wants to create a short video reel for: "${query}".
Search your knowledge base and provide:
1. The official song name and artist.
2. A short selection of 3-4 viral, aesthetic, and emotionally resonant lines of the lyrics, separated by newlines. IMPORTANT: The lyrics MUST be in capital letters and clean of formatting. Keep it to 3-4 lines maximum.
3. An aesthetic theme ID that fits this song. Choose ONLY from: 'minimal-dark', 'aesthetic-beige', 'vintage-film', 'anime-vibe', 'bhojpuri-folk', 'romantic-sunset', 'luxury-gold'.
4. A highly engaging and viral Instagram caption with emojis and trending hashtags.

Return the response as a valid JSON object ONLY. JSON keys must be:
- "songName" (string)
- "artistName" (string)
- "lyrics" (string)
- "themeId" (string)
- "caption" (string)

Example structure:
{
  "songName": "Tum Se Hi",
  "artistName": "Mohit Chauhan",
  "lyrics": "TUM SE HI DIN HOTA HAI\\nSURMAYI SHAAM AATI HAI\\nTUM SE HI TUM SE HI",
  "themeId": "romantic-sunset",
  "caption": "Tag someone special ❤️✨\\n\\nFollow for more aesthetics 🎧\\n#tumsehi #aesthetic #lofi #trending"
}`
      userPrompt = `Get lyrics details for query: "${query}"`
    }

    // 3. Call completions pipeline with models fallback
    let parsedData: any = {}
    try {
      parsedData = await callAIChatCompletions(systemPrompt, userPrompt)
    } catch (aiErr: any) {
      console.error(`[AI Lyrics] AI fallback pipeline completely failed:`, aiErr.message)
      // High resilience fallback: construct mock metadata if AI failed entirely
      parsedData = {
        songName: songName,
        artistName: artistName || "Various Artists",
        lyrics: "IF I COULD REACH THE STARS\nI'D GIVE THEM ALL TO YOU\nYOU'RE MY EVERYTHING",
        caption: `Listening to ${songName} ✨🎧 #aesthetic #lofi #trending`,
        themeId: "minimal-dark"
      }
    }

    const finalSongTitle = parsedData.songName || songName
    const finalArtist = parsedData.artistName || artistName
    const finalLyrics = parsedData.lyrics
    const finalCaption = parsedData.caption
    const finalThemeId = parsedData.themeId

    // 4. Query YouTube Data API to fetch corresponding audio
    let audioUrl = ""
    const youtubeKey = process.env.YOUTUBE_API_KEY
    if (youtubeKey) {
      try {
        const searchQuery = `${finalSongTitle} ${finalArtist} audio`.trim()
        console.log(`[AI Lyrics] Searching YouTube for: "${searchQuery}"`)
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&key=${youtubeKey}&maxResults=1`
        )
        
        if (ytRes.ok) {
          const ytData = await ytRes.json()
          const videoId = ytData.items?.[0]?.id?.videoId
          if (videoId) {
            audioUrl = `https://www.youtube.com/watch?v=${videoId}`
            console.log(`[AI Lyrics] Found YouTube URL: ${audioUrl}`)
          }
        }
      } catch (ytError) {
        console.error(`[AI Lyrics] YouTube search failed:`, ytError)
      }
    }

    // Fallback search link if YT search yields nothing
    if (!audioUrl) {
      audioUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(finalSongTitle + ' ' + finalArtist)}`
    }

    return NextResponse.json({
      success: true,
      songName: finalSongTitle,
      artistName: finalArtist,
      lyrics: finalLyrics,
      caption: finalCaption,
      themeId: finalThemeId,
      audioUrl: audioUrl
    }, { status: 200 })

  } catch (error: any) {
    console.error('[AI Lyrics] Magic fetch route error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch AI lyrics' }, { status: 500 })
  }
}
