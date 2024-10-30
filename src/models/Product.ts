import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    ecommerceId: {
      type: String,
      required: true
    },
    productType: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
})

export default mongoose.model('Product', productSchema)
