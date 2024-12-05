import mongoose from 'mongoose'

export interface IWhitelabel {
  baseUrl: string
  name: string
  description?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  banner?: {
    title: string
    description?: string | null
  } | null
  logoUrl?: string | null
  productTypes?: mongoose.Types.ObjectId[] | null
  socialMedia?: {
    wpp?: string | null
    instagram?: string | null
    facebook?: string | null
    twitter?: string | null
  } | null
  pixKey?: {
    phone?: string | null
    cpf?: string | null
    other?: string | null
  } | null
  createdAt?: Date
  updatedAt?: Date
}
