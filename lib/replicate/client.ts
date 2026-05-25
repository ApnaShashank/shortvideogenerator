interface ImageOptions {
  aspectRatio: '9:16' | '16:9' | '1:1'
  videoStyle?: string
}

export async function generateImageWithReplicate(
  prompt: string,
  options: ImageOptions
): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.warn('[Replicate] No REPLICATE_API_TOKEN configured')
    return null
  }

  // Construct styled prompt
  let styleSuffix = 'realistic stock photo style, high quality, highly detailed, 4k'
  const style = options.videoStyle?.toLowerCase()
  if (style === 'anime') {
    styleSuffix = 'anime illustrative style, vibrant colors, detailed, digital illustration'
  } else if (style === 'cyberpunk') {
    styleSuffix = 'cyberpunk futuristic style, neon lighting, dark synthwave background, highly detailed'
  } else if (style === 'cinematic-3d') {
    styleSuffix = 'cinematic 3d render style, octane render, photorealistic, depth of field, 8k resolution'
  }
  
  const finalPrompt = `${prompt}, ${styleSuffix}`
  const aspect = options.aspectRatio === '9:16' ? '9:16' : options.aspectRatio === '1:1' ? '1:1' : '16:9'

  try {
    console.log(`[Replicate] Starting prediction: prompt="${finalPrompt}", aspect="${aspect}"`)
    const response = await fetch('https://api.replicate.com/v1/models/bytedance/sdxl-lightning-4step/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: finalPrompt,
          aspect_ratio: aspect,
          num_outputs: 1,
          output_format: 'webp',
          output_quality: 90
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Replicate] API call failed:', response.status, errorText)
      return null
    }

    let prediction = await response.json()
    console.log(`[Replicate] Prediction created: id=${prediction.id}`)

    // Poll until succeeded or failed
    const maxPolls = 20
    let polls = 0
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && polls < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 800))
      polls++
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      })
      if (!pollResponse.ok) {
        console.error('[Replicate] Polling failed:', pollResponse.status)
        return null
      }
      prediction = await pollResponse.json()
      console.log(`[Replicate] Polling: status=${prediction.status}`)
    }

    if (prediction.status === 'succeeded' && prediction.output && prediction.output[0]) {
      const outputUrl = prediction.output[0]
      console.log(`[Replicate] Success: outputUrl=${outputUrl}`)
      return outputUrl
    }

    console.error('[Replicate] Prediction did not succeed. Final status:', prediction.status)
    return null
  } catch (err) {
    console.error('[Replicate] Error generating image:', err)
    return null
  }
}
