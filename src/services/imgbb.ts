import dotenv from 'dotenv'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Readable } from 'stream'

dotenv.config()

const apiKey = process.env.IMGBB_API_KEY || ''

export const uploadImageImgBB = async ({
  file,
}: {
  file: Express.Multer.File
}): Promise<any> => {
  console.log('uploading image to ImgBB...')
  if (!apiKey) {
    throw new Error('ImgBB API key not found.')
  }

  const formData = new FormData()

  const buffer = file.buffer
  const bufferStream = new Readable()
  bufferStream.push(buffer)
  bufferStream.push(null)

  formData.append('image', bufferStream, file.originalname)

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  })
  console.log('response:', response)

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`)
  }

  const data = await response.json()

  console.log('image uploaded successfully, link:', data.data.url)
  return data.data
}
