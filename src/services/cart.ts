import Cart from '../models/Cart'
import { Types } from 'mongoose'
import Product from '../models/Product'
import dotenv from 'dotenv'
import Order from '../models/Order'
import { createPayment, ICreatePayment } from './payment'
import Whitelabel from '../models/Whitelabel'
import { createCustomer, createPixQRCode } from './asaas'
import User from '../models/User'
import { addMonths } from 'date-fns'

dotenv.config()

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
  console.log(`getting cart with id: ${cartId}`)
  const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate({
    path: 'items.productId',
    strictPopulate: false,
  })
  if (!cart) {
    console.log(`cart not found with id ${cartId}`)
    return { message: 'Carrinho não encontrado', code: 'cart_not_found' }
  }
  console.log(`found cart with id ${cartId}`)

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
  paymentData: {
    totalAmount: number
  }
}

export const createOrder = async ({
  cartId,
  userId,
  ecommerceId,
  paymentData,
}: ICreateOrder) => {
  console.log(`searching cart with id "${cartId}" to create a new order`)
  const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate(
    'items.productId'
  )

  if (!cart) {
    throw new Error('Carrinho não encontrado.')
  }

  console.log('cart found:', cart)

  // console.log('getting the seller access token...')
  // const whitelabel = await Whitelabel.findById(ecommerceId)
  //
  // if (!whitelabel) {
  //   console.error('whitelabel not found:', whitelabel)
  //   throw new Error('Whitelabel not found.')
  // }

  console.log(`getting the user data by id: ${userId}`)
  const userData = await User.findById(userId)

  if (!userData) {
    console.error('user not found:', userData)
    throw new Error('User not found.')
  }
  console.log('user found:', userData)

  console.log('creating customer in asaas...')

  if (!userData.name || !userData.email || !userData.cpf || !userData.phone) {
    console.error('missing user data:', userData)
    throw new Error('Missing user data.')
  }

  const customerResponse = await createCustomer({
    name: userData.name,
    email: userData.email,
    cpfCnpj: userData.cpf,
    phone: userData.phone,
    notificationDisabled: true,
  })

  if (!customerResponse || !customerResponse.id) {
    console.error('customer response missing id:', customerResponse)
    throw new Error('Customer response not found.')
  }

  console.log('creating payment for order...')
  const paymentResponse = await createPixQRCode({
    customer: customerResponse.id,
    value: paymentData.totalAmount,
    dueDate: addMonths(new Date(), 6).toISOString(),
  })
  console.log('payment created successfully.')

  if (!paymentResponse || !paymentResponse?.billing?.id) {
    console.error('payment response missing billing id:', paymentResponse)
    throw new Error('Payment response not found.')
  }

  if (!paymentResponse.pix) {
    console.error('pix data missing in the response:', paymentResponse)
    throw new Error('Pix data not found in payment response')
  }

  const { payload: copyPasteCode, encodedImage: qrCodeBase64 } =
    (paymentResponse.pix as unknown as {
      payload: string
      encodedImage: string
    }) || {
      payload: '',
      encodedImage: '',
    }

  if (!qrCodeBase64) {
    console.error('qr code missing in the response:', paymentResponse)
    throw new Error('QR Code not found in payment response.')
  }

  console.log('creating new order...')
  const newOrder = new Order({
    userId,
    ecommerceId,
    items: cart.items,
    paymentData: {
      id: paymentResponse.billing.id,
      type: 'pix', // TOOD: Integrate other payment types
      totalAmount: paymentData.totalAmount,
      qrCode: qrCodeBase64,
      pixCode: copyPasteCode,
    },
    status: 'pending',
  })

  await newOrder.save()

  console.log('order created:', newOrder)
  console.log('deleting cart...')

  await Cart.findByIdAndDelete(cartId)
  console.log('cart deleted:', cart)

  return newOrder
}
