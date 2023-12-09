import { Product } from "./Product";
import { Reception } from "./Reception";
import { SystemUser } from "./SystemUser";
import { User } from "./User";

/*
 * 0: Anulado
 * 1: Pendiente
 * 2: En Proceso
 * 3: Entregado | Cancelado
 */
export enum OrderStatus {
  "ANULLED" = 0,
  "PENDING" = 1,
  "IN_PROCESS" = 2,
  "DEVOTED" = 3,
}
export enum OrderType {
  "IN_LOCAL" = "COMER EN LOCAL",
  "TAKEAWAY" = "PARA LLEVAR",
}
export enum PaymentMethod {
  "CASH" = "AL CONTADO",
  "VISA" = "VISA",
  "MASTERCARD" = "MASTERCARD",
}
export enum OrderChannel {
  "APP" = "APP",
  "PRESENCIAL" = "PRESENCIAL",
}

export type Order = {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  client: User;
  user_identity_type: string;
  user_document_number: string;
  reception: Reception;
  recepcionist: SystemUser;
  reception_date: Date | string;
  payment_method: PaymentMethod;
  estimated_time: number;
  tax: number;
  subtotal: number;
  total: number;
  order_channel: OrderChannel;
  end_date: Date | string;
  items: OrderDetail[];
};

// type Delivered = 0 | 1;

export type OrderDetail = {
  id: string;
  order: Order;
  product: Product;
  quantity: number;
  price_of_sale: number;
  // delivered: Delivered;
};

export type OrderLine = {
  product: string;
  quantity: number;
};

export const ORDER_COLLECTION = "orders";
export const ORDER_DETAILS_COLLECTION = "order_details";
