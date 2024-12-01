import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  ecommerceId: {
    type: String,
    required: true,
  },
  productType: {
    type: String,
    required: true,
  },
  image: {
    type: [String],
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  fields: [
    {
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["text", "number", "options"],
        required: true,
      },
      options: {
        type: [String],
        default: [],
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
});

export default mongoose.model("Product", productSchema);
