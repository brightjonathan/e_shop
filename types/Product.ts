import { Timestamp } from "firebase/firestore";

export interface ProductType {
  id?: string;

  productName: string;
  imageURL: string;
  price: number;
  category: string;
  brand: string;
  description: string;

  createdAt?: Timestamp;
  editedAt?: Timestamp;

  author?: {
    isAdmin: boolean;
    admin: string;
    id: string;
    email: string;
  };
}