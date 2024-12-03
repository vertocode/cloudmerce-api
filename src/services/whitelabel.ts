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

export const getWhitelabelById = async (
  whitelabelId: string
): Promise<IWhitelabel | null> => {
  try {
    const whitelabel = await Whitelabel.findById(whitelabelId)
    if (!whitelabel) {
      return null
    }
    return whitelabel
  } catch (error) {
    console.error('Error getting whitelabel:', error)
    throw error
  }
}
