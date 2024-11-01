import type { Express } from 'express'
import express, { Response } from 'express'
import cors from 'cors'
import {auth, checkUserExists, createUser, getUsers} from './services/user'
import {
    addProductType,
    deleteProductType,
    updateProductType,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductsByEcommerceId,
    getProductTypesByEcommerceId,
    getProductsByFilters
} from './services/product';
import * as mongoose from "mongoose"
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const port: number = 4000
app.use(cors({ origin: '*' }))
app.options('*', cors())
app.use(express.json())

app.get('/', (_, res: Response): void => {
    res.send({ status: 'OK' })
})

app.get('/auth/login', async (req, res: Response): Promise<void> => {
    try {
        const { email, password } = req.query
        if (!email || !password) {
            throw new Error('Invalid body, email and password are required.')
        }

        const response = await auth({
            email: email as string,
            password: password as string
        })
        res.status(200).send(response)
    } catch (error) {
        const errorMessage = `Error logging in: ${error}`
        console.error(errorMessage)
        res.status(500).send({ error: errorMessage })
    }
})

app.get('/users', async (_, res: Response): Promise<void> => {
    try {
        const response = await getUsers()
        res.status(200).send(response)
    } catch (error) {
        const errorMessage = `Error getting users: ${error}`
        res.status(500).send({ error: errorMessage })
    }
})

app.post('/users', async (req, res: Response): Promise<void> => {
    try {
        if (!req.body.name || !req.body.email || !req.body.password) {
            throw new Error('Invalid body, name, email and password are required.')
        }
        const userAlreadyExists = await checkUserExists(req.body.email)
        if (userAlreadyExists && userAlreadyExists.length) {
            res.status(200).send({ error: 'User already exists.', errorCode: 'user_already_exists' })
            return
        }
        const response = await createUser(req.body)
        console.log(`User created successfully: ${response.name} | ${response?._id}`)
        res.status(201).send(response)
    } catch (error) {
        const errorMessage = `Error creating user: ${error}`
        console.error(errorMessage)
        res.status(400).send({ error: errorMessage, errorCode: 'unexpected_error' })
    }
})

app.post('/product-types', async (req, res: Response): Promise<void> => {
    try {
        const { ecommerceId, name } = req.body;
        if (!ecommerceId || !name) {
            throw new Error('Invalid body, ecommerceId and name are required.');
        }
        const response = await addProductType({ ecommerceId, name });
        res.status(201).send(response);
    } catch (error) {
        const errorMessage = `Error adding product type: ${error}`;
        res.status(400).send({ error: errorMessage });
    }
});

app.delete('/product-types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const response = await deleteProductType(new mongoose.Types.ObjectId(id));
        if (!response) {
            res.status(404).send({ error: 'ProductType not found.' });
            return;
        }
        res.status(200).send({ message: 'ProductType deleted successfully.' });
    } catch (error) {
        const errorMessage = `Error deleting product type: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

app.put('/product-types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;
        const response = await updateProductType(new mongoose.Types.ObjectId(id), data);
        if (!response) {
            res.status(404).send({ error: 'ProductType not found.' });
            return;
        }
        res.status(200).send(response);
    } catch (error) {
        const errorMessage = `Error updating product type: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

app.post('/products', async (req, res: Response): Promise<void> => {
    try {
        const { ecommerceId, productType, name, price, description = '', image = [] } = req.body;
        if (!ecommerceId || !productType || !name || price === undefined || image.length === 0) {
            throw new Error('Invalid body, ecommerceId, productType, name, image, and price are required.');
        }
        const response = await addProduct({ ecommerceId, productType, name, price, image, description });
        res.status(201).send(response);
    } catch (error) {
        const errorMessage = `Error adding product: ${error}`;
        res.status(400).send({ error: errorMessage });
    }
});

app.delete('/products/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const response = await deleteProduct(new mongoose.Types.ObjectId(id));
        if (!response) {
            res.status(404).send({ error: 'Product not found.' });
            return;
        }
        res.status(200).send({ message: 'Product deleted successfully.' });
    } catch (error) {
        const errorMessage = `Error deleting product: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

app.put('/products/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;
        const response = await updateProduct(new mongoose.Types.ObjectId(id), data);
        if (!response) {
            res.status(404).send({ error: 'Product not found.' });
            return;
        }
        res.status(200).send(response);
    } catch (error) {
        const errorMessage = `Error updating product: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

app.get('/products/ecommerce/:ecommerceId', async (req, res: Response): Promise<void> => {
    try {
        const { ecommerceId } = req.params || {}
        const { productType = null, search = null } = req.query || {}
        let response
        if (productType || search) {
            response = await getProductsByFilters({
                ecommerceId,
                productType: productType as string,
                search: search as string
            })
        } else {
            response = await getProductsByEcommerceId(ecommerceId)
        }
        res.status(200).send(response)
    } catch (error) {
        const errorMessage = `Error getting products: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

app.get('/product-types/ecommerce/:ecommerceId', async (req, res: Response): Promise<void> => {
    try {
        const { ecommerceId } = req.params;
        const response = await getProductTypesByEcommerceId(ecommerceId);
        res.status(200).send(response);
    } catch (error) {
        const errorMessage = `Error getting product types: ${error}`;
        res.status(500).send({ error: errorMessage });
    }
});

const mongoUsername = process.env.MONGO_USERNAME
const mongoPassword = process.env.MONGO_PASSWORD
const mongoAppName = process.env.MONGO_APP_NAME
const uri = `mongodb+srv://${mongoUsername}:${mongoPassword}@cloudmerce.ggxeq.mongodb.net/?retryWrites=true&w=majority&appName=${mongoAppName}`

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err))

app.listen(port, (): void => {
    console.log(`Cloudmerce API running on port: ${port}`)
})

module.exports = app
