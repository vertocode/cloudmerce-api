import Cart from '../models/Cart'
import {Types} from "mongoose";
import Product from "../models/Product";

export const createCart = async (ecommerceId: string, productType: string, userId: Types.ObjectId) => {
    const newCart = new Cart({
        ecommerceId,
        productType,
        userId,
        items: [],
    })

    await newCart.save()
    return newCart
}

interface IAddItemToCart {
    cartId: Types.ObjectId | null
    productId: Types.ObjectId
    quantity: number
    ecommerceId: string
}

export const addItemToCart = async ({ cartId, productId, quantity, ecommerceId }: IAddItemToCart) => {
    let newCartId = cartId
    if (!newCartId) {
        const newCart = await createCart('ecommerceId', 'productType', new Types.ObjectId())
        newCartId = newCart._id
    }

    const cart = await Cart.findById(newCartId)

    if (!cart) {
        throw new Error('Carrinho não encontrado.')
    }

    const existingItem = cart.items.find(item => item.productId?.toString() === productId.toString())

    const product = await Product.findById(productId)
    if (!product) {
        throw new Error('Produto não encontrado.');
    }

    if (existingItem) {
        existingItem.quantity += quantity
    } else {
        cart.items.push({
            productId: productId,
            quantity,
            price: product.price
        });
    }

    cart.updatedAt = new Date()

    await cart.save()

    return cart
}
