import mongoose from 'mongoose'

const productTypeSchema = new mongoose.Schema({
  ecommerceId: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
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

export default mongoose.model('ProductType', productTypeSchema)
