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
type OrderStatus = 0 | 1 | 2 | 3;
type OrderType = "COMER EN LOCAL" | "PARA LLEVAR";
type PaymentMethod = "AL CONTADO" | "VISA" | "MASTERCARD";
type OrderChannel = "APP" | "PRESENCIAL";

type Order = {
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
  tax: number;
  subtotal: number;
  total: number;
  order_channel: OrderChannel;
  end_date: Date | string;
  items: OrderDetail[];
};

type Delivered = 0 | 1;

type OrderDetail = {
  id: string;
  order: Order;
  product: Product;
  quantity: number;
  price_of_sale: number;
  delivered: Delivered;
};

export const ORDER_COLLECTION = "orders";
export const ORDER_DETAILS_COLLECTION = "orders_details";
