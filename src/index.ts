import type { Express } from 'express'
import express, { Response } from 'express'
import cors from 'cors'
import { auth, checkUserExists, createUser } from './services/user'
import {
  addProductType,
  addProduct,
  deleteProduct,
  updateProduct,
  getProductsByEcommerceId,
  getProductTypesByEcommerceId,
  getProductsByFilters,
  updateProductTypes,
  getProductById,
} from './services/product'
import * as mongoose from 'mongoose'
import dotenv from 'dotenv'
import {
  addItemToCart,
  changeQuantity,
  createOrder,
  getCart,
} from './services/cart'
import { Types } from 'mongoose'
import { setUserData } from './services/checkout'
import {
  changeOrderStatus,
  getOrderById,
  getOrdersByUserId,
} from './services/order'
import { IWhitelabel } from './types/Whitelabel'
import {
  createWhitelabel,
  getWhitelabelByBaseUrl,
  updateWhitelabelById,
} from './services/whitelabel'
import { createPayment, getPayment, ICreatePayment } from './services/payment'

dotenv.config()

const app: Express = express()
const port: number = 4000
app.use(cors({ origin: '*' }))
app.options('*', cors())
app.use(express.json())

const mongoUsername = process.env.MONGO_USERNAME
const mongoPassword = process.env.MONGO_PASSWORD
const mongoAppName = process.env.MONGO_APP_NAME
const uri = `mongodb+srv://${mongoUsername}:${mongoPassword}@cloudmerce.ggxeq.mongodb.net/?retryWrites=true&w=majority&appName=${mongoAppName}`

mongoose
  .connect(uri)
  .then(() => {
    console.log('Connected to MongoDB...')
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB...', err)
  })

app.get('/', (_, res: Response): void => {
  const isConnected = mongoose.connections.every(
    (connection) => connection.readyState === 1
  )

  if (isConnected) {
    res.send({ status: 'OK: Connected with MongoDB' })
  } else {
    res.status(500).send({
      error: 'API not connected with database',
      code: 'db_not_connected',
    })
  }
})

app.get('/auth/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.query
    if (!email || !password) {
      throw new Error('Invalid body, email and password are required.')
    }

    const response = await auth({
      email: email as string,
      password: password as string,
    })
    res.status(200).send(response)
  } catch (error) {
    const errorMessage = `Error logging in: ${error}`
    console.error(errorMessage)
    res.status(500).send({ error: errorMessage })
  }
})

app.post('/users', async (req, res: Response): Promise<void> => {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.whitelabelId
    ) {
      throw new Error(
        'Invalid body, name, email, whitelabelId and password are required.'
      )
    }
    const userAlreadyExists = await checkUserExists(
      req.body.email,
      req.body.whitelabelId
    )
    if (userAlreadyExists && userAlreadyExists.length) {
      res.status(200).send({
        error: 'User already exists.',
        errorCode: 'user_already_exists',
      })
      return
    }
    const response = await createUser(req.body)
    console.log(
      `User created successfully: ${response.name} | ${response?._id}`
    )
    res.status(201).send(response)
  } catch (error) {
    const errorMessage = `Error creating user: ${error}`
    console.error(errorMessage)
    res.status(400).send({ error: errorMessage, errorCode: 'unexpected_error' })
  }
})

app.post('/product-types', async (req, res: Response): Promise<void> => {
  try {
    const { ecommerceId, name, icon } = req.body
    if (!ecommerceId || !name) {
      throw new Error('Invalid body, ecommerceId and name are required.')
    }
    const response = await addProductType({
      ecommerceId,
      name,
      icon: icon || '',
    })
    res.status(201).send(response)
  } catch (error) {
    const errorMessage = `Error adding product type: ${error}`
    res.status(400).send({ error: errorMessage })
  }
})

app.put(
  '/product-types/multiple-update',
  async (req, res: Response): Promise<void> => {
    try {
      const { productTypes } = req.body
      if (!productTypes || !Array.isArray(productTypes)) {
        throw new Error(
          'Invalid body, productTypes is required and must be an array.'
        )
      }
      const response = await updateProductTypes({
        productTypes: productTypes.map((productType: any) => {
          return {
            action: productType?.action,
            id: productType.id
              ? new mongoose.Types.ObjectId(productType.id)
              : undefined,
            name: productType?.name,
            icon: productType?.icon,
            ecommerceId: productType?.ecommerceId,
          }
        }),
      })
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error updating the product types: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.post('/products', async (req, res: Response): Promise<void> => {
  try {
    const {
      ecommerceId,
      productType,
      name,
      price,
      description = '',
      image = [],
      fields = [],
      stock,
    } = req.body
    if (
      !ecommerceId ||
      !productType ||
      !name ||
      price === undefined ||
      image.length === 0
    ) {
      throw new Error(
        'Invalid body, ecommerceId, productType, name, image, and price are required.'
      )
    }
    const response = await addProduct({
      ecommerceId,
      productType,
      name,
      price,
      image,
      description,
      fields,
      stock,
    })
    res.status(201).send(response)
  } catch (error) {
    const errorMessage = `Error adding product: ${error}`
    res.status(400).send({ error: errorMessage })
  }
})

app.delete('/products/:id', async (req, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const response = await deleteProduct(new mongoose.Types.ObjectId(id))
    if (!response) {
      res.status(404).send({ error: 'Product not found.' })
      return
    }
    res.status(200).send({ message: 'Product deleted successfully.' })
  } catch (error) {
    const errorMessage = `Error deleting product: ${error}`
    res.status(500).send({ error: errorMessage })
  }
})

app.put('/products/:id', async (req, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body
    const response = await updateProduct(new mongoose.Types.ObjectId(id), data)
    if (!response) {
      res.status(404).send({ error: 'Product not found.' })
      return
    }
    res.status(200).send(response)
  } catch (error) {
    const errorMessage = `Error updating product: ${error}`
    res.status(500).send({ error: errorMessage })
  }
})

app.get(
  '/products/ecommerce/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { ecommerceId } = req.params || {}
      const {
        productType = null,
        search = null,
        limit = null,
        page = null,
      } = req.query || {}
      let response
      if (productType || search || limit) {
        response = await getProductsByFilters({
          ecommerceId,
          productType: productType as string,
          search: search as string,
          limit: Number(limit) as number,
          page: Number(page) as number,
        })
      } else {
        response = await getProductsByEcommerceId(ecommerceId)
      }
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error getting products: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.get(
  '/products/:ecommerceId/:productId',
  async (req, res: Response): Promise<void> => {
    try {
      const { ecommerceId, productId } = req.params
      if (!ecommerceId || !productId) {
        throw new Error('Invalid body, ecommerceId and productId are required.')
      }

      const response = await getProductById(
        new mongoose.Types.ObjectId(productId),
        ecommerceId
      )
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error getting product: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.get(
  '/product-types/ecommerce/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { ecommerceId } = req.params
      const response = await getProductTypesByEcommerceId(ecommerceId)
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error getting product types: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.get('/get-cart/:ecommerceId', async (req, res: Response): Promise<void> => {
  try {
    const { ecommerceId } = req.params
    const { cartId } = req.query
    if (!cartId) {
      throw new Error('Invalid body, cartId is required.')
    }
    const response = await getCart({
      cartId: cartId as unknown as Types.ObjectId,
      ecommerceId,
    })
    if ((response as { code: string })?.code === 'cart_not_found') {
      res.status(200).send(response)
      return
    }

    if (!(response as { _id: string })?._id) {
      throw new Error('Fail to get _id in the response.')
    }
    res.status(200).send(response)
  } catch (error) {
    const errorMessage = `Error getting cart: ${error}`
    res.status(500).send({ error: errorMessage })
  }
})

app.put(
  '/add-cart-item/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { ecommerceId } = req.params
      const { cartId, productId, quantity, fields = [] } = req.body
      const response = await addItemToCart({
        cartId,
        productId,
        quantity,
        ecommerceId,
        fields,
      })
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error adding item to cart: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.put(
  '/change-cart-item-quantity/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { cartId, productId, quantity, fields = [], cartItemId } = req.body
      const response = await changeQuantity({
        cartId,
        productId,
        cartItemId,
        quantity,
        fields,
      })
      res.status(200).send(response)
    } catch (error) {
      const errorMessage = `Error changing item quantity in cart: ${error}`
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.post(
  '/checkout/user/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { ecommerceId } = req.params
      const { cartId, userData } = req.body

      const response = await setUserData({
        cartId,
        userData,
        ecommerceId,
      })

      console.log('[/checkout/user]: User registered in cart with success.')

      res.status(200).send(response)
    } catch (e) {
      console.error(e)
      res.status(500).send({
        error: 'Erro ao realizar o cadastro dos dados do usuario no checkout.',
        code: 'error',
      })
    }
  }
)

app.post('/order/:ecommerceId', async (req, res: Response): Promise<void> => {
  try {
    const { ecommerceId } = req.params
    const { cartId, userId, paymentData } = req.body

    const response = await createOrder({
      cartId,
      userId,
      ecommerceId,
      paymentData,
    })

    res.status(200).send({
      message: 'Pedido criado com sucesso.',
      code: 'success',
      order: response,
    })
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Erro ao criar o pedido.', code: 'error' })
  }
})

app.get(
  '/order/:orderId/:ecommerceId',
  async (req, res: Response): Promise<void> => {
    try {
      const { orderId, ecommerceId } = req.params
      const response = await getOrderById({ orderId, ecommerceId })
      res.status(200).send(response)
    } catch (err) {
      console.error(err)
      res.status(500).send({ error: 'Erro ao buscar o pedido.', code: 'error' })
    }
  }
)

app.get('/orders/:ecommerceId', async (req, res: Response): Promise<void> => {
  try {
    const { ecommerceId } = req.params
    const { userId } = req.query
    const response = await getOrdersByUserId({
      userId: userId as string,
      ecommerceId,
    })
    res.status(200).send(response)
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: 'Erro ao buscar o pedido.', code: 'error' })
  }
})

app.post('/whitelabel', async (req, res: Response): Promise<void> => {
  try {
    const {
      baseUrl,
      name,
      description,
      primaryColor,
      secondaryColor,
      banner,
      logoUrl,
      productTypes,
      socialMedia,
      pixKey,
      paymentData,
    } = req.body

    if (!baseUrl || !name) {
      res.status(400).send({
        error: 'Invalid body, ecommerceId, baseUrl, and name are required.',
      })
      return
    }

    const whitelabelData: IWhitelabel = {
      baseUrl,
      name,
      description,
      primaryColor,
      secondaryColor,
      banner,
      logoUrl,
      productTypes,
      socialMedia,
      pixKey,
      paymentData,
    }

    const newWhitelabel = await createWhitelabel(whitelabelData)

    res.status(201).send(newWhitelabel)
  } catch (error) {
    const errorMessage = `Error creating whitelabel: ${error}`
    console.error(errorMessage)
    res.status(500).send({ error: errorMessage })
  }
})

app.get('/whitelabel/:baseUrl', async (req, res: Response): Promise<void> => {
  try {
    const { baseUrl } = req.params

    if (!baseUrl) {
      res.status(400).send({
        error: 'Invalid request, whitelabel baseUrl is required.',
      })
      return
    }

    const whitelabel = await getWhitelabelByBaseUrl(baseUrl)

    res.status(200).send(whitelabel)
  } catch (error) {
    const errorMessage = `Error getting whitelabel: ${error}`
    console.error(errorMessage)
    res.status(500).send({ error: errorMessage })
  }
})

app.get(
  '/whitelabel/payment-data/:baseUrl',
  async (req, res: Response): Promise<void> => {
    try {
      const { baseUrl } = req.params

      if (!baseUrl) {
        res.status(400).send({
          error: 'Invalid request, whitelabel baseUrl is required.',
        })
        return
      }

      const whitelabel = await getWhitelabelByBaseUrl(baseUrl, true)

      res.status(200).send(whitelabel.paymentData)
    } catch (error) {
      const errorMessage = `Error getting whitelabel: ${error}`
      console.error(errorMessage)
      res.status(500).send({ error: errorMessage })
    }
  }
)

app.put('/whitelabel/:id', async (req, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const whitelabelData = req.body

    if (!id) {
      res.status(400).send({
        error: 'Invalid request, whitelabel id is required.',
      })
      return
    }

    const updatedWhitelabel = await updateWhitelabelById(id, whitelabelData)

    res.status(200).send(updatedWhitelabel)
  } catch (error) {
    const errorMessage = `Error updating whitelabel: ${error}`
    console.error(errorMessage)
    res.status(500).send({ error: errorMessage })
  }
})

app.get('/get-payment/:id', async (req, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const response = await getPayment(id)
    res.status(200).send(response)
  } catch (e) {
    console.error(e)
    res.status(500).send({
      error: 'Erro ao buscar o pagamento.',
      code: 'error',
    })
  }
})

app.post('/create-payment', async (req, res: Response): Promise<void> => {
  const body = req.body as ICreatePayment
  try {
    const response = await createPayment(body)
    res.status(200).send(response)
  } catch (e) {
    console.error(e)
    res.status(500).send({
      error: 'Erro ao realizar o pagamento.',
      code: 'error',
    })
  }
})

app.put('/update-order-status', async (req, res: Response): Promise<void> => {
  const body = req.body as { orderId: string; status: string }
  try {
    const response = await changeOrderStatus(body)
    res.status(200).send(response)
  } catch (e) {
    console.error(e)
    res.status(500).send({
      error: 'Erro ao atualizar o status do pedido.',
      code: 'error',
    })
  }
})

app.listen(port, (): void => {
  console.log(`Cloudmerce API running on port: ${port}`)
})

module.exports = app
