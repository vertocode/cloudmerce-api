import { User as UserType } from '../types/User'
import { checkUserExists, createUser, updateUser } from './user'
import { setUserId } from './cart'
import { Types } from 'mongoose'

interface SetUserDataParams {
  cartId: Types.ObjectId
  userData: UserType | Partial<UserType>
  ecommerceId: string
}

export const setUserData = async ({
  userData,
  cartId,
  ecommerceId,
}: SetUserDataParams) => {
  const isLogged = !!userData?._id

  if (!isLogged) {
    userData = (await createUser(userData as UserType)) as UserType
  } else {
    const userExists = await checkUserExists(
      userData?.email as string,
      ecommerceId
    )

    if (!userExists) {
      throw new Error('User not found with email: ' + userData.email)
    }

    await updateUser(userData?._id as Types.ObjectId, userData)
  }

  await setUserId(cartId, userData?._id as Types.ObjectId)

  return userData
}
