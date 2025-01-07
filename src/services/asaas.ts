import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const accessToken = process.env.ASAAS_ACCESS_TOKEN || ''
const apiURL = 'https://sandbox.asaas.com/api/v3'

interface CustomerRequest {
  name: string
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
      customer: 'cus_000006431794',
      billingType: 'PIX',
      value: 50,
      dueDate: '2025-06-06',
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

    return pixResponse.data
  } catch (error: any) {
    console.error(
      'Error creating qrcode:',
      error.response?.data || error.message
    )
    throw new Error(error.response?.data?.message || 'Failed to create qrcode')
  }
}
