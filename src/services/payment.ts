import { MercadoPagoConfig, Payment } from 'mercadopago'
import dotenv from 'dotenv'

dotenv.config()

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

if (!accessToken) {
  throw new Error('Mercado Pago access token not found.')
}

const client = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
  },
})

export interface ICreatePayment {
  description: string
  paymentMethod: 'pix'
  totalAmount: number
  payer: {
    email: string
  }
}

const validateParams = (body: Partial<ICreatePayment>) => {
  const { description, payer } = body || {}

  if (!description) {
    throw new Error('Description is required.')
  }

  if (!payer?.email) {
    throw new Error('Payer email is required.')
  }
}

export const createPayment = async (params: ICreatePayment) => {
  validateParams(params)
  const { description, payer, totalAmount } = params

  const payment = new Payment(client)

  const body = {
    transaction_amount: totalAmount, // Each 1 is 1 BRL
    // transactions: { // TODO: Split later
    //   payments: [
    //     {
    //       amount: 10.0,
    //       payment_method: {
    //         id: 'pix',
    //         type: 'pix',
    //         token: '',
    //         installments: 1,
    //       },
    //     },
    //   ],
    // },
    description,
    payment_method_id: 'pix',
    payer,
  }

  const requestOptions = {}

  return payment.create({ body, requestOptions })
}

export const getPayment = async (paymentId: string) => {
  const payment = new Payment(client)

  return payment.get({ id: paymentId })
}
