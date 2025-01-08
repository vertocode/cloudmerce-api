import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const accessToken = process.env.ASAAS_ACCESS_TOKEN || ''
const apiURL = `${process.env.ASAAS_API_URL}/api/v3`

if (!accessToken) {
  throw new Error('Asaas access token not found.')
}

if (!process.env.ASAAS_API_URL) {
  throw new Error('Asaas API URL not found.')
}

interface CustomerRequest {
  name: string
  email?: string
  phone?: string
  cpfCnpj: string
}

interface CustomerResponse {
  id: string
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
}

const headers = {
  Access_token: accessToken,
}

export const createCustomer = async (
  data: CustomerRequest
): Promise<CustomerResponse> => {
  console.log('Creating customer with data:', data)
  try {
    if (!accessToken) {
      throw new Error('Asaas access token not found.')
    }
    const response = await axios.post<CustomerResponse>(
      `${apiURL}/customers`,
      data,
      {
        headers,
      }
    )
    console.log('Customer created successfully:', response.data)
    return response.data
  } catch (error: any) {
    console.error(
      'Error creating customer:',
      error.response?.data || error.message
    )
    throw new Error(
      error.response?.data?.message || 'Failed to create customer'
    )
  }
}

export interface ICreatePixQRCode {
  customer: string
  value: number
  dueDate: string
}

export const createPixQRCode = async (data: ICreatePixQRCode) => {
  try {
    console.log('Creating billing before creating the qrcode with data:', data)
    const params = {
      billingType: 'PIX',
      ...data,
    }
    const billingResponse = await axios.post<CustomerResponse>(
      `${apiURL}/payments`,
      params,
      {
        headers,
      }
    )
    const { id: billingId } = billingResponse.data || { id: '' }

    if (!billingId) {
      console.log('Billing id not found:', billingResponse)
      throw new Error('Billing id not found')
    }
    console.log('Billing created successfully:', billingResponse)

    console.log('Creating pix qrcode with billing id:', billingId)

    const pixResponse = await axios.post<CustomerResponse>(
      `${apiURL}/payments/${billingId}/pixQrCode`,
      {},
      {
        headers,
      }
    )

    console.log('Pix QRCode created successfully:', pixResponse)

    return {
      pix: pixResponse.data,
      billing: billingResponse.data,
    }
  } catch (error: any) {
    console.error(
      'Error creating qrcode:',
      error.response?.data || error.message
    )
    throw new Error(error.response?.data?.message || 'Failed to create qrcode')
  }
}

/**
 * Retrieves the payment status from the Asaas API.
 * @param paymentId Payment ID in Asaas.
 * @returns Payment data or throws an error if not found.
 */
export const getPayment = async (paymentId: string) => {
  try {
    const response = await axios.get(`${apiURL}/payments/${paymentId}`, {
      headers,
    })

    return response.data
  } catch (error) {
    console.error(
      `Error fetching payment from Asaas for ID: ${paymentId}`,
      error
    )
    throw new Error('Failed to fetch payment from Asaas.')
  }
}

/**
 * Updates the order status based on the payment status in the Asaas API.
 * @param order The order to be updated.
 */
export const updateOrderStatus = async (order: any) => {
  console.log(
    'The order has a pending payment. Checking if the payment is approved in the Asaas API...'
  )

  const { paymentData } = order || {}
  const paymentId = (paymentData as unknown as { id: string })?.id

  if (!paymentData || !paymentId) {
    throw new Error('Unable to find the payment ID.')
  }

  const paymentResponse = await getPayment(paymentId)

  if (!paymentResponse) {
    throw new Error('Unable to find the payment in the Asaas API.')
  }

  const paymentStatus = paymentResponse.status

  if (paymentStatus === 'RECEIVED') {
    console.log('Payment approved. Updating order status to "paid".')
    order.status = 'paid'
    await order.save()
  } else {
    console.log(
      `Payment not approved. Keeping order status as "pending": ${paymentStatus}`
    )
  }
}
