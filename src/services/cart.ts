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
