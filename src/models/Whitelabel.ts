import mongoose from 'mongoose'

export const whitelabelSchema = new mongoose.Schema({
  baseUrl: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  primaryColor: {
    type: String,
    required: false,
  },
  secondaryColor: {
    type: String,
    required: false,
  },
  banner: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  logoUrl: {
    type: String,
    required: false,
  },
  productTypes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductType',
    },
  ],
  socialMedia: {
    wpp: {
      type: String,
      required: false,
    },
    instagram: {
      type: String,
      required: false,
    },
    facebook: {
      type: String,
      required: false,
    },
    twitter: {
      type: String,
      required: false,
    },
  },
  pixKey: {
    phone: {
      type: String,
      required: false,
    },
    cpf: {
      type: String,
      required: false,
    },
    other: {
      type: String,
      required: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Whitelabel', whitelabelSchema)
