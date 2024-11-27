import {Types} from "mongoose";

interface UserAddress {
    cep: string
    neighborhood: string
    street: string
    number: string
    city: string
    state: string
    country?: string
}

export interface User {
    _id: Types.ObjectId
    name: string
    email: string
    role?: 'admin' | 'user'
    cpf?: string
    phone?: string
    hasWhatsapp?: boolean
    birthday?: string
    password: string
    createdAt: Date
    address: UserAddress
    activeToken: string
    activeTokenExpires: Date
}

export interface AuthParams {
    email: string
    password: string
}

export interface UpdateUserParams {
    _id: string
    name?: string
    email?: string
    password?: string
    role?: 'admin' | 'user'
    activeToken?: string
    address?: UserAddress
    activeTokenExpires?: Date
}
