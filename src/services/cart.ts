import Cart from '../models/Cart'
import {Types} from "mongoose";
import Product from "../models/Product";

export const createCart = async (ecommerceId: string) => {
    const newCart = new Cart({
        ecommerceId,
        items: [],
    })

    await newCart.save()
    return newCart
}

interface IAddItemToCart {
    cartId: Types.ObjectId | null
    productId: Types.ObjectId
    fields: {
      fieldLabel: string
      value: string
    }[]
    quantity: number
    ecommerceId: string
}

export const addItemToCart = async ({ cartId, productId, quantity, fields, ecommerceId }: IAddItemToCart) => {
    let newCartId = cartId
    if (!newCartId) {
        const newCart = await createCart(ecommerceId)
        newCartId = newCart._id
    }

    const cart = await Cart.findById(newCartId)

    if (!cart) {
        throw new Error('Carrinho não encontrado.')
    }

    const existingItem = cart.items.find(item => {
        const hasTheSameId = item.productId?.toString() === productId.toString()
        const hasTheSameFields = item.fieldValues?.every(field => {
            const newField = fields.find(f => f.fieldLabel === field.fieldLabel)
            return newField?.value === field?.value
        })

        return hasTheSameId && hasTheSameFields
    })

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
