import crypto from 'crypto'

/**
 * Uploads a buffer directly to ImageKit using their standard REST API.
 * This avoids external dependency bloat and works seamlessly in Vercel Serverless environments.
 * 
 * @param fileBuffer The file content as a Buffer.
 * @param fileName The name of the file to save as (e.g. video-123.mp4).
 * @param folder The folder path in ImageKit (e.g. /lyrics-flow).
 * @returns The secure CDN URL of the uploaded asset.
 */
export async function uploadToImageKit(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = '/lyrics-flow'
): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

  if (!privateKey) {
    throw new Error('IMAGEKIT_PRIVATE_KEY is missing from environment variables.')
  }

  const base64File = fileBuffer.toString('base64')
  
  const formData = new FormData()
  formData.append('file', base64File)
  formData.append('fileName', fileName)
  formData.append('folder', folder)
  
  // ImageKit uses Basic Auth with Private Key as username and password empty
  const authString = Buffer.from(privateKey + ':').toString('base64')

  console.log(`[ImageKit] Uploading ${fileName} to folder ${folder}...`)

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[ImageKit] Upload failed:`, response.status, errorText)
    throw new Error(`ImageKit Upload failed: ${response.statusText} (${errorText})`)
  }

  const data = await response.json()
  console.log(`[ImageKit] Upload successful! URL: ${data.url}`)
  return data.url
}
