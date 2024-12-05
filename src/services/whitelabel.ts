import { IWhitelabel } from '../types/Whitelabel'
import Whitelabel from '../models/Whitelabel'

const getUrlByHost = (host: string) => {
  if (host.includes('http')) {
    return host
  }
  if (host.includes('localhost')) {
    return `http://${host}`
  }
  return `https://${host}`
}

export const createWhitelabel = async (whitelabelData: IWhitelabel) => {
  try {
    const baseUrl = getUrlByHost(whitelabelData.baseUrl)
    const whitelabel = await Whitelabel.find({ baseUrl })
    if (whitelabel && whitelabel?.length) {
      return { code: 409, message: 'Whitelabel already exists' }
    }
    whitelabelData.baseUrl = baseUrl
    return await Whitelabel.create(whitelabelData)
  } catch (error) {
    console.error('Error creating whitelabel:', error)
    throw error
  }
}

export const getWhitelabelByBaseUrl = async (
  baseHost: string
): Promise<any> => {
  try {
    const baseUrl = getUrlByHost(baseHost)
    const whitelabel = await Whitelabel.find({ baseUrl })
    if (!whitelabel || !whitelabel?.length) {
      return { code: 404, message: 'Whitelabel not found' }
    }
    if (whitelabel.length > 1) {
      console.error('More than one whitelabel found:', whitelabel)
      return {
        code: 500,
        message: `More than one whitelabel found with baseUrl: ${baseUrl}`,
      }
    }
    return whitelabel.at(0)
  } catch (error) {
    console.error('Error getting whitelabel:', error)
    throw error
  }
}
