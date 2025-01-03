import axios from 'axios'

export interface OAuthParams {
  clientId: string
  clientSecret: string
  authorizationCode: string
  redirectUri: string
  state: string
}

export const oauth = async (params: OAuthParams) => {
  const { clientId, clientSecret, authorizationCode, redirectUri, state } =
    params

  if (
    !clientId ||
    !clientSecret ||
    !authorizationCode ||
    !redirectUri ||
    !state
  ) {
    throw new Error('Missing required parameters')
  }

  const data = new URLSearchParams()
  data.append('client_id', clientId)
  data.append('client_secret', clientSecret)
  data.append('grant_type', 'authorization_code')
  data.append('code', authorizationCode)
  data.append('redirect_uri', redirectUri)
  data.append('state', state)

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
