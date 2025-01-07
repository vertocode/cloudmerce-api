import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const accessToken = process.env.ASAAS_ACCESS_TOKEN || ''

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

export const createCustomer = async (
  data: CustomerRequest
): Promise<CustomerResponse> => {
  console.log('Creating customer with data:', data)
  try {
    if (!accessToken) {
      throw new Error('Asaas access token not found.')
    }
    const response = await axios.post<CustomerResponse>(
      'https://sandbox.asaas.com/api/v3/customers',
      data,
      {
        headers: {
          Access_token: accessToken,
        },
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
