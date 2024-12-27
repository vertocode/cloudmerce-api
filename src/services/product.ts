import Product from '../models/Product'
import ProductType from '../models/ProductType'
import { Document, Types } from 'mongoose'
import { CustomError } from '../utils/error'
import {
  IProduct,
  IProductFilters,
  UpdateProductTypesParams,
} from '../types/Product'

interface ProductTypeData extends Document {
  ecommerceId: string
  name: string
  createdAt?: Date
  updatedAt?: Date
  icon?: string
}

interface ProductData extends Document {
  ecommerceId: string
  productType: string
  name: string
  price: number
  fields: {
    label: string
    type: 'text' | 'number' | 'options'
    options?: string[]
  }[]
  createdAt?: Date
  updatedAt?: Date
}

// ProductType
export async function addProductType(data: {
  ecommerceId: number
  name: string
  icon: string
}) {
  const existingProductType = await ProductType.findOne({ name: data.name })
  if (existingProductType) {
    throw new CustomError(
      'PRODUCT_TYPE_EXISTS',
      `Um tipo de produto com o nome '${data.name}' já existe.`
    )
  }

  return ProductType.create(data)
}

export async function deleteProductType(
  productTypeId: Types.ObjectId,
  ecommerceId: number
) {
  return ProductType.findByIdAndDelete(productTypeId, { ecommerceId })
  // TODO: Delete all products with the product type
}

export async function updateProductType(
  productTypeId: Types.ObjectId,
  ecommerceId: number,
  data: Partial<ProductTypeData>
) {
  if (data.name) {
    const existingProductType = await ProductType.findOne({
      name: data.name,
      ecommerceId,
      _id: { $ne: productTypeId },
    })
    if (existingProductType) {
      throw new CustomError(
        'PRODUCT_TYPE_EXISTS',
        `Um tipo de produto com o nome '${data.name}' já existe.`
      )
    }
  }
  // TODO: Update all products with the new product type

  return ProductType.findByIdAndUpdate(productTypeId, data, { new: true })
}

export async function updateProductTypes({
  productTypes,
}: UpdateProductTypesParams) {
  return Promise.all(
    productTypes.map(async (productType) => {
      switch (productType.action) {
        case 'add':
          if (!productType.name || !productType.ecommerceId) {
            throw new Error('name and ecommerceId are required for add action.')
          }
          return addProductType({
            ecommerceId: productType.ecommerceId,
            name: productType.name,
            icon: productType?.icon || '',
          })
        case 'update':
          if (
            !productType.name ||
            !productType.id ||
            !productType.ecommerceId
          ) {
            throw new Error('name and id is required for update action.')
          }
          return updateProductType(productType.id, productType.ecommerceId, {
            name: productType.name,
            icon: productType?.icon || '',
          })
        case 'delete':
          if (!productType.id || !productType.ecommerceId) {
            throw new Error('id is required for delete action.')
          }
          return deleteProductType(productType.id, productType.ecommerceId)
        default:
          throw new Error(
            `Invalid action "${productType?.action} for product type: ${productType?.name}".`
          )
      }
    })
  )
}

async function validateProductTypeExists(
  productType: string
): Promise<boolean> {
  const existingProductType = await ProductType.findOne({ _id: productType })
  return !!existingProductType
}

export async function getProductTypesByEcommerceId(ecommerceId: string) {
  return ProductType.find({ ecommerceId })
}

// Product
export async function addProduct(data: IProduct) {
  const isProductTypeValid = await validateProductTypeExists(data.productType)
  if (!isProductTypeValid) {
    throw new Error('ProductType does not exist.')
  }
  return Product.create(data)
}

export async function deleteProduct(productId: Types.ObjectId) {
  return Product.findByIdAndDelete(productId)
}

export async function updateProduct(
  productId: Types.ObjectId,
  data: Partial<ProductData>
) {
  if (data.productType) {
    const isProductTypeValid = await validateProductTypeExists(data.productType)
    if (!isProductTypeValid) {
      throw new Error('ProductType does not exist.')
    }
  }
  return Product.findByIdAndUpdate(
    productId,
    {
      ...data,
      updatedAt: new Date(),
    },
    { new: true }
  )
}

export async function getProductById(
  productId: Types.ObjectId,
  ecommerceId: string
) {
  return Product.findById({ _id: productId, ecommerceId })
}

export async function getProductsByEcommerceId(ecommerceId: string) {
  return Product.find({ ecommerceId })
}

export async function getProductsByFilters(filters: IProductFilters) {
  const { ecommerceId, productType, search, limit, page } = filters

  const query: any = { ecommerceId }
  if (productType) {
    query.productType = productType
  }
  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  const pageNumber = page && page > 0 ? page : 1
  const pageSize = limit || 20

  const totalDocuments = await Product.countDocuments(query)

  const totalPages = Math.ceil(totalDocuments / pageSize)

  const products = await Product.find(query)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)

  return {
    products,
    totalPages,
    page: pageNumber,
    limit: pageSize,
  }
}
