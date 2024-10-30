import Product from '../models/Product'
import ProductType from '../models/ProductType'
import { Document, Types } from 'mongoose'
import {CustomError} from "../utils/error";

interface ProductTypeData extends Document {
    ecommerceId: string
    name: string
    createdAt?: Date
    updatedAt?: Date
}

interface ProductData extends Document {
    ecommerceId: string
    productType: string
    name: string
    price: number
    createdAt?: Date
    updatedAt?: Date
}

// ProductType
export async function addProductType(data: { ecommerceId: string, name: string }) {
    const existingProductType = await ProductType.findOne({ name: data.name });
    if (existingProductType) {
        throw new CustomError('PRODUCT_TYPE_EXISTS', `Um tipo de produto com o nome '${data.name}' já existe.`);
    }

    return ProductType.create(data)
}

export async function deleteProductType(productTypeId: Types.ObjectId) {
    return ProductType.findByIdAndDelete(productTypeId)
}

export async function updateProductType(productTypeId: Types.ObjectId, data: Partial<ProductTypeData>) {
    if (data.name) {
        const existingProductType = await ProductType.findOne({ name: data.name, _id: { $ne: productTypeId } });
        if (existingProductType) {
            throw new CustomError('PRODUCT_TYPE_EXISTS', `Um tipo de produto com o nome '${data.name}' já existe.`);
        }
    }

    return ProductType.findByIdAndUpdate(productTypeId, data, { new: true })
}

async function validateProductTypeExists(productType: string): Promise<boolean> {
    const existingProductType = await ProductType.findOne({ _id: productType })
    return !!existingProductType
}

// Product
export async function addProduct(data: { ecommerceId: string, productType: string, name: string, price: number }) {
    const isProductTypeValid = await validateProductTypeExists(data.productType);
    if (!isProductTypeValid) {
        throw new Error('ProductType does not exist.');
    }
    return Product.create(data)
}

export async function deleteProduct(productId: Types.ObjectId) {
    return Product.findByIdAndDelete(productId)
}

export async function updateProduct(productId: Types.ObjectId, data: Partial<ProductData>) {
    if (data.productType) {
        const isProductTypeValid = await validateProductTypeExists(data.productType);
        if (!isProductTypeValid) {
            throw new Error('ProductType does not exist.');
        }
    }
    return Product.findByIdAndUpdate(productId, data, { new: true })
}
