import User from '../models/User'
import { AuthParams, User as UserType } from '../types/User'
import { uuid } from 'uuidv4'
import mongoose, { Types } from 'mongoose'

export async function getUsers() {
  return User.find()
}

export async function checkUserExists(email: string, whitelabelId: string) {
  const filters = {
    email: { $eq: email },
    whitelabelId: { $eq: new mongoose.Types.ObjectId(whitelabelId) },
  }
  return User.find(filters)
}

export async function updateUser(_id: Types.ObjectId, data: Partial<UserType>) {
  return User.findByIdAndUpdate(_id, data)
}

export async function createUser(data: UserType) {
  return User.create(data)
}

function generateToken() {
  return uuid()
}

type ErrorCodes = 'user_not_found'
export async function auth(
  data: AuthParams
): Promise<UserType | { errorMessage: string; errorCode: ErrorCodes }> {
  const filters = {
    email: { $eq: data.email },
    password: { $eq: data.password },
  }
  const response = await User.find(filters)
  if (response.length) {
    const {
      _id,
      name,
      email,
      password,
      createdAt,
      address,
      role = 'user',
      cpf,
      phone,
      hasWhatsapp,
      birthday,
    } = response.at(0) as unknown as UserType
    return {
      _id,
      name,
      email,
      password,
      role,
      cpf,
      phone,
      birthday,
      hasWhatsapp,
      createdAt,
      address,
      activeToken: generateToken(),
      activeTokenExpires: new Date(Date.now() + 86400000),
    }
  } else {
    return { errorMessage: 'User not found', errorCode: 'user_not_found' }
  }
}
