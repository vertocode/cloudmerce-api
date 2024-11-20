import Cart from '../models/Cart'
import {Types} from "mongoose";
import Product from "../models/Product";
import Stripe from 'stripe'

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

const getExistingItem = (cart: any, productId: Types.ObjectId, fields: Field[]) => {
    return cart.items.find((item: any) => {
        const hasTheSameId = item.productId?.toString() === productId.toString()
        const hasTheSameFields = item.fieldValues?.every((field: any) => {
            const newField = fields.find(f => f.fieldLabel === field.fieldLabel)
            return newField?.value === field?.value
        })

        return hasTheSameId && hasTheSameFields
    })
}

interface IItemToCart {
    cartId: Types.ObjectId | null
    productId: Types.ObjectId
    fields: Field[]
    quantity: number
    ecommerceId: string
}

export const addItemToCart = async ({ cartId, productId, quantity, fields, ecommerceId }: IItemToCart) => {
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
        throw new Error('Produto não encontrado.');
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
            fieldValues: fields
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

export const changeQuantity = async ({ cartId, productId, quantity, fields, ecommerceId }: IItemToCart) => {
    const cart = await Cart.findOne({ _id: cartId, ecommerceId })

    if (!cart) {
        throw new Error(`Cart not found with cartId: ${cartId} (ecommerceId: ${ecommerceId}).`)
    }

    const existingItem = getExistingItem(cart, productId, fields)

    if (!existingItem) {
        throw new Error(`Item not found in cart with productId: ${productId}.`)
    }

    if (quantity === 0) {
        // @ts-ignore
        cart.items = cart.items.filter(item => item !== existingItem)
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
    const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate('items.productId')
    if (!cart) {
        throw new Error('Carrinho não encontrado.')
    }

    return cart
}

interface ICreateOrder {
    cartId: Types.ObjectId;
    userId: Types.ObjectId;
    ecommerceId: string;
    paymentMethod: 'pix' | 'card' | 'pm_card_visa';
    cardDetails?: {
        number: string;
        expMonth: number;
        expYear: number;
        cvc: string;
    };
}

export const createOrder = async ({
                                      cartId,
                                      userId,
                                      ecommerceId,
                                      paymentMethod,
                                      cardDetails
                                  }: ICreateOrder) => {
    // 1. Retrieve the cart
    const cart = await Cart.findById({ _id: cartId, ecommerceId }).populate('items.productId')
    if (!cart) {
        throw new Error('Cart not found')
    }

    // Calculate the total amount of the cart
    const amount = cart.items.reduce((total, item: any) => total + item.quantity * item.price, 0) * 100 // In cents (BRL)

    // 2. Define the payment method
    if (paymentMethod === 'card' || paymentMethod === 'pm_card_visa') {
        // Check if card details were provided
        if (!cardDetails) {
            throw new Error('Card details are required for card payments')
        }

        // Create a payment method with card details
        const paymentMethodObj = await stripe.paymentMethods.create({
            type: 'card',
            payment_method: paymentMethod,
            card: {
                number: cardDetails.number,
                exp_month: cardDetails.expMonth,
                exp_year: cardDetails.expYear,
                cvc: cardDetails.cvc,
            },
        })

        // Confirm the payment intent with the payment method
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 50, // TODO: Change to amount
            currency: 'brl',
            payment_method: paymentMethodObj.id,
            confirm: true,
        })

        console.log('Card payment confirmed:', paymentIntent)
        return {
            status: 'success',
            paymentIntent,
        }
    } else if (paymentMethod === 'pix') {
        // Create a payment intent for Pix
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 50, // TODO: Change to amount
            currency: 'brl',
            payment_method_types: ['pix'],
        })

        console.log('Pix payment created:', paymentIntent)

        // Return the QR Code and Pix code
        return {
            status: 'pending',
            // pixQrCode: paymentIntent.next_action.pix_display_qr_code.url,
            // pixCopyPaste: paymentIntent.next_action.pix_display_qr_code.text,
            clientSecret: paymentIntent.client_secret,
        }
    } else {
        throw new Error('Invalid payment method')
    }
}
