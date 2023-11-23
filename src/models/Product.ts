import { Category } from "./Category";
import { Available, Status } from "./Generic";

export type Product = {
  id?: string;
  name?: string;
  price?: number;
  available?: Available;
  description?: string;
  status?: Status;
  category?: Category;
  created_date?: Date | string;
  updated_date?: Date | string;
};

export const PRODUCT_COLLECTION = "products";
