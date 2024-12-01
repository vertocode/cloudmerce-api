import { Types } from "mongoose";

export interface IProduct {
  ecommerceId: string;
  name: string;
  price: number;
  productType: string;
  description?: string;
  image: string[];
  fields: Array<{
    label: string;
    type: "text" | "number" | "options";
  }>;
}

export interface IProductFilters {
  ecommerceId: string;
  productType?: string | null;
  search?: string | null;
}

export interface UpdateProductTypesParams {
  productTypes: {
    action: "add" | "update" | "delete";
    id?: Types.ObjectId; // required for update, and delete
    name?: string; // required for add, and update
    ecommerceId: number; // required for all
  }[];
}
