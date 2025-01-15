import dotenv from 'dotenv'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Readable } from 'stream'

dotenv.config()

const clientId = process.env.IMGUR_CLIENT_ID || ''

export const uploadImage = async ({
  file,
}: {
  file: Express.Multer.File
}): Promise<any> => {
  console.log('uploading image to imgur...')
  if (!clientId) {
    throw new Error('Imgur client ID not found.')
  }

  const formData = new FormData()

  const buffer = file.buffer
  const bufferStream = new Readable()
  bufferStream.push(buffer)
  bufferStream.push(null)

  formData.append('image', bufferStream, file.originalname)

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${clientId}`,
    },
    body: formData,
  })

  console.log(response, 'response')

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`)
  }

  const data = await response.json()

  console.log('image uploaded successfully, link:', data)
  return data
}
