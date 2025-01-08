import Order from '../models/Order'
import mongoose from 'mongoose'
import { updateOrderStatus as updateOrderStatusMP } from './mp'
import { updateOrderStatus as updateOrderStatusAsaas } from './asaas'

interface IGetOrderById {
  orderId: string
  ecommerceId: string
}

const useMercadoPage = false
const useAsaas = true

export const getOrderById = async ({ orderId, ecommerceId }: IGetOrderById) => {
  console.log(`getting order with id: ${orderId}`)
  const order = await Order.findById({ _id: orderId, ecommerceId }).populate(
    'items.productId'
  )

  console.log(`found order with id: ${orderId}`)

  if (!order) {
    throw new Error('Pedido não encontrado.')
  }

  if (order.status === 'pending') {
    if (useMercadoPage) {
      await updateOrderStatusMP(order)
    }

    if (useAsaas) {
      await updateOrderStatusAsaas(order)
    }
  }

  return order
}

interface IGetOrdersByUserId {
  userId: string
  ecommerceId: string
}

export const getOrdersByUserId = async ({
  userId,
  ecommerceId,
}: IGetOrdersByUserId) => {
  console.log('Valor do userId:', userId)

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('userId inválido')
  }

  const objectIdUser = new mongoose.Types.ObjectId(userId)

  console.log(
    'Consultando pedidos com userId:',
    objectIdUser,
    'ecommerceId:',
    ecommerceId
  )

  const orders = await Order.find({
    userId: objectIdUser,
    ecommerceId,
  }).populate('items.productId')

  if (!orders || orders.length === 0) {
    console.log('Nenhum pedido encontrado para esse userId e ecommerceId')
  }

  return orders || []
}

export const changeOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: string
  status: string
}) => {
  const availableStatuses = ['pending', 'paid', 'product_sent', 'finished']
  if (!status || !availableStatuses.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Available statuses: ${availableStatuses.join(', ')}`
    )
  }

  console.log(
    `changing order status to ${status} for order with id: ${orderId}`
  )
  const order = await Order.findById(orderId)
  if (!order) {
    throw new Error('Order not found.')
  }

  order.status = status as (typeof order)['status']

  await order.save()
  console.log(`order status changed to ${status}`)

  return order
}
