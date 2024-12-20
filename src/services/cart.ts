import Cart from '../models/Cart'
import { Types } from 'mongoose'
import Product from '../models/Product'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import Order from '../models/Order'

dotenv.config()

const apiKey = process.env.STRIPE_API_KEY || ''
if (!apiKey) {
  throw new Error('Stripe API key not found.')
}
const stripe = new Stripe(apiKey)

export const createCart = async (ecommerceId: string) => {
  const newCart = new Cart({
    ecommerceId,
    items: [],
  })

  await newCart.save()
  return newCart
}

interface Field {
  fieldLabel: string
  value: string
}

const getExistingItem = (
  cart: any,
  productId: Types.ObjectId,
  fields: Field[]
) => {
  return cart.items.find((item: any) => {
    const hasTheSameId = item.productId?.toString() === productId.toString()
    const hasTheSameFields = item.fieldValues?.every((field: any) => {
      const newField = fields.find((f) => f.fieldLabel === field.fieldLabel)
      return newField?.value === field?.value
    })

    return hasTheSameId && hasTheSameFields
  })
}

interface IItemToCart {
  cartId: Types.ObjectId | null
  cartItemId?: Types.ObjectId
  productId: Types.ObjectId
  fields: Field[]
  quantity: number
  ecommerceId: string
}

export const addItemToCart = async ({
  cartId,
  productId,
  quantity,
  fields,
  ecommerceId,
}: IItemToCart) => {
  let newCartId = cartId
  if (!newCartId) {
    const newCart = await createCart(ecommerceId)
    newCartId = newCart._id
  }

  const cart = await Cart.findById({ _id: newCartId, ecommerceId })

  if (!cart) {
    throw new Error('Carrinho não encontrado.')
  }

  const existingItem = getExistingItem(cart, productId, fields)

  const product = await Product.findById(productId)
  if (!product) {
    throw new Error('Produto não encontrado.')
  }

  const handleIncreaseQuantity = () => {
    if (!existingItem) return

    existingItem.quantity += quantity
    if (fields.length) {
      existingItem.fieldValues = fields as any
    }
  }

  const handleNewItem = () => {
    cart.items.push({
      productId: productId,
      quantity,
      price: product.price,
      fieldValues: fields,
    })
  }

  if (existingItem) {
    handleIncreaseQuantity()
  } else {
    handleNewItem()
  }

  cart.updatedAt = new Date()

  await cart.save()

  return cart
}

export const changeQuantity = async ({
  cartId,
  productId,
  cartItemId,
  quantity,
  fields,
}: Omit<IItemToCart, 'ecommerceId'>) => {
  const cart = await Cart.findOne({ _id: cartId })

  if (!cart) {
    throw new Error(`Cart not found with cartId: ${cartId}`)
  }

  const shouldDeleteCart =
    cart.items.length === 1 && cart.items[0].quantity === 1 && quantity === 0

  if (cartItemId) {
    console.log(`Deleting expired item from cart with id: ${cartItemId}`)
    const foundItem = cart.items.find(
      (item) => item?._id?.toString() === cartItemId.toString()
    )
    if (!foundItem) {
      console.log('Item not found in cart:', cart)
      throw new Error(`Item not found in cart with cartItemId: ${cartItemId}.`)
    }
    console.log('Item found to be deleted:', foundItem)

    if (shouldDeleteCart) {
      console.log(
        'There is only 1 item in the cart, so the cart will be deleted'
      )
      await Cart.findByIdAndDelete(cartId)
      console.log('Cart deleted:', cart)
      return {
        message: 'Cart deleted because the deleted item was the last item',
      }
    }

    console.log('Cart before deleting item:', cart)

    // @ts-ignore
    cart.items = cart.items.filter((item) => {
      console.log(
        `${item._id} === ${foundItem._id}?`,
        item._id === foundItem._id
      )
      return item._id !== foundItem._id
    })

    console.log('Cart after deleting item:', cart)

    cart.updatedAt = new Date()

    console.log('Saving cart...')
    await cart.save()

    console.log('Cart saved:', cart)

    return cart
  }

  const existingItem = getExistingItem(cart, productId, fields)

  if (!existingItem) {
    throw new Error(`Item not found in cart with productId: ${productId}.`)
  }

  if (shouldDeleteCart) {
    console.log('There is only 1 item in the cart, so the cart will be deleted')
    await Cart.findByIdAndDelete(cartId)
    console.log('Cart deleted:', cart)
    return {
      message: 'Cart deleted because the deleted item was the last item',
    }
  }

  if (quantity === 0) {
    // @ts-ignore
    cart.items = cart.items.filter((item) => item !== existingItem)
  } else {
    existingItem.quantity = quantity
  }

  cart.updatedAt = new Date()

  await cart.save()

  return cart
}

interface IGetCart {
  cartId: Types.ObjectId
  ecommerceId: string
}

export const getCart = async ({ cartId, ecommerceId }: IGetCart) => {
  const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate({
    path: 'items.productId',
    strictPopulate: false,
  })
  if (!cart) {
    throw new Error('Carrinho não encontrado.')
  }

  return cart
}

export const setUserId = async (
  cartId: Types.ObjectId,
  userId: Types.ObjectId
) => {
  const cart = await Cart.findById({ _id: cartId })
  if (!cart) {
    throw new Error('Carrinho não encontrado.')
  }

  cart.userId = userId
  await cart.save()

  return cart
}

interface ICreateOrder {
  cartId: Types.ObjectId
  userId: Types.ObjectId
  ecommerceId: string
  paymentIntentId: string
}

export const createOrder = async ({
  cartId,
  userId,
  ecommerceId,
  paymentIntentId,
}: ICreateOrder) => {
  const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate(
    'items.productId'
  )
  if (!cart) {
    throw new Error('Carrinho não encontrado.')
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    throw new Error('O pagamento não foi concluído com sucesso.')
  }

  const newOrder = new Order({
    userId,
    ecommerceId,
    items: cart.items,
    totalAmount: paymentIntent.amount_received,
    paymentMethod: 'card',
    paymentIntentId,
    status: 'paid',
  })

  await newOrder.save()

  await Cart.findByIdAndDelete(cartId)

  return newOrder
}
