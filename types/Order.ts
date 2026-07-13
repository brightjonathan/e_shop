import { Timestamp } from "firebase/firestore";

export interface OrderItem {
  id: string;
  productName: string;
  imageURL: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode?: string;
}

export type DeliveryMethod = "standard" | "express" | "pickup";

// Fulfillment status — how far along the order is physically.
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Packing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

// Separate from OrderStatus — since ALL orders require payment upfront,
// an order should never really move past "Pending" fulfillment unless
// paymentStatus is "Paid". Kept separate because it maps directly to
// what Paystack tells us.
export type PaymentStatus = "Pending" | "Paid" | "Failed";

export interface OrderType {
  id?: string;
  userId: string;
  userEmail?: string | null;

  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;

  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;

  courier?: string;
  trackingNumber?: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}