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
  totalAmount: string
  payer: {
    email: string
  }
  sellerAccessToken: string // Access Token do dono da loja
}

const validateParams = (body: Partial<ICreatePayment>) => {
  const { description, payer, sellerAccessToken } = body || {}

  if (!description) {
    throw new Error('Description is required.')
  }

  if (!payer?.email) {
    throw new Error('Payer email is required.')
  }

  if (!sellerAccessToken) {
    console.warn(
      'Seller access token is not defined, the payment will be created with 100% for cloudmerce account.'
    )
  }
}

export const createPayment = async (params: ICreatePayment) => {
  console.log('Creating payment with params:', params)
  validateParams(params)
  const { description, payer, totalAmount, sellerAccessToken } = params

  const payment = new Payment(client)

  const totalAmountNumber = Number(totalAmount)
  const cloudmerceAmount = parseFloat((totalAmountNumber * 0.01).toFixed(2))
  const sellerAmount = parseFloat((totalAmountNumber * 0.99).toFixed(2))

  console.log('Total amount:', totalAmountNumber)
  console.log('Cloudmerce amount:', cloudmerceAmount)
  console.log('Seller amount:', sellerAmount)

  const body = {
    transaction_amount: totalAmountNumber,
    description,
    payment_method_id: 'pix',
    payer,
    // marketplace_fee: cloudmerceAmount,
    // collector_id: sellerAccessToken || accessToken, // Access token from the seller, if not defined, the payment will be created with 100% for cloudmerce account
    sponsor_id: Number(sellerAccessToken.split('-').pop()), // Seller ID
    application_fee: sellerAmount,
    marketplace: sellerAccessToken,
    additional_info: {
      items: [
        {
          id: 'seller-1',
          title: description,
          unit_price: totalAmountNumber,
          quantity: 1,
        },
      ],
    },
  }

  const requestOptions = {}

  const paymentResponse = await payment.create({ body, requestOptions })

  console.log(`Payment created id: ${paymentResponse.id}`)

  return paymentResponse
}

export const getPayment = async (paymentId: string) => {
  const payment = new Payment(client)

  return payment.get({ id: paymentId })
}
