export interface IProduct {
    ecommerceId: string
    name: string
    price: number
    productType: string
    description?: string
    image?: string
}

export interface  IProductFilters {
    ecommerceId: string
    productType?: string | null
    search?: string | null
}
