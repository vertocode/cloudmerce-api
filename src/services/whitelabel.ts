import { IWhitelabel } from '../types/Whitelabel'
import Whitelabel from '../models/Whitelabel'

export const createWhitelabel = async (whitelabelData: IWhitelabel) => {
  try {
    return await Whitelabel.create(whitelabelData)
  } catch (error) {
    console.error('Error creating whitelabel:', error)
    throw error
  }
}

export const getWhitelabelByBaseUrl = async (baseUrl: string): Promise<any> => {
  try {
    const whitelabel = await Whitelabel.find({ baseUrl })
    if (!whitelabel || !whitelabel?.length) {
      return { code: 404, message: 'Whitelabel not found' }
    }
    return whitelabel
  } catch (error) {
    console.error('Error getting whitelabel:', error)
    throw error
  }
}
