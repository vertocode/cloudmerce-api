import mongoose from 'mongoose'

export const orderSchema = new mongoose.Schema({
  ecommerceId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  paymentData: {
    type: {
      type: String,
      enum: ['pix', 'card'],
    },
    qrCode: {
      type: String, // base64 (required for pix)
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      fieldValues: {
        type: [
          {
            fieldLabel: {
              type: String,
              required: true,
            },
            value: {
              type: String,
              required: true,
            },
          },
        ],
        required: false,
        default: [],
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Order', orderSchema)
