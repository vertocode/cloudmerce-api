import Order from "../models/Order";

interface IGetOrderById {
    orderId: string
    ecommerceId: string
}

export const getOrderById = async ({ orderId, ecommerceId }: IGetOrderById) => {
    const order = await Order.findById({ _id: orderId, ecommerceId }).populate('items.productId')
    if (!order) {
        throw new Error('Pedido não encontrado.')
    }

    return order
}

interface IGetOrdersByUserId {
    userId: string
    ecommerceId: string
}

export const getOrdersByUserId = async ({ userId, ecommerceId }: IGetOrdersByUserId) => {
    const orders = await Order.find({ userId, ecommerceId }).populate('items.productId')

    return orders || []
}
