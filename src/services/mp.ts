import axios from 'axios'
import dotenv from 'dotenv'
import { getPayment } from './payment'

dotenv.config()

export interface OAuthParams {
  authorizationCode: string
  redirectUri: string
  state: string
}

export const oauth = async (params: OAuthParams) => {
  const { authorizationCode, redirectUri, state } = params

  const clientId = process.env.MERCADO_PAGO_CLIENT_ID
  const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET

  console.log('checking params for oauth with mercado pago')
  if (
    !clientId ||
    !clientSecret ||
    !authorizationCode ||
    !redirectUri ||
    !state
  ) {
    console.log('clientId', clientId)
    console.log('clientSecret', clientSecret)
    console.log('authorizationCode', authorizationCode)
    console.log('redirectUri', redirectUri)
    console.log('state', state)
    throw new Error('Missing required parameters')
  }

  const data = new URLSearchParams()
  data.append('client_id', clientId)
  data.append('client_secret', clientSecret)
  data.append('grant_type', 'authorization_code')
  data.append('code', authorizationCode)
  data.append('redirect_uri', redirectUri)
  data.append('state', state)

  console.log('making oauth request with mercado pago')

  try {
    const response = await axios.post(
      'https://api.mercadopago.com/oauth/token',
      data,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    console.log('success with oauth request:', response.data)

    return response.data
  } catch (error) {
    console.error(
      'Error during OAuth request:',
      // @ts-ignore
      error?.response ? error?.response?.data : error?.message
    )
    throw new Error('Failed to obtain OAuth token')
  }
}

export const updateOrderStatus = async (order: any) => {
  console.log(
    'order has pending payment, checking if the payment is paid in mercadopago api...'
  )
  const { paymentData } = order || {}
  const paymentId = (paymentData as unknown as { id: string })?.id
  if (!paymentData || !paymentId) {
    throw new Error('Não foi possível encontrar o id do pagamento')
  }
  const paymentResponse = await getPayment(paymentId)

  if (!paymentResponse) {
    throw new Error('Não foi possível encontrar o pagamento')
  }

  if (paymentResponse.status === 'approved') {
    console.log('payment is approved, updating order status to paid')
    order.status = 'paid'
    await order.save()
  } else {
    console.log(
      `payment is not approved, keeping order status as pending: ${paymentResponse.status}`
    )
  }
}
