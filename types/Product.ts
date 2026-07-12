import { Timestamp } from "firebase/firestore";

export interface ProductType {
  id?: string;

  productName: string;

  /** Cover/thumbnail image — used in product cards, cart items, and lists.
   *  This is just imageURLs[0]; kept as its own field so nothing else
   *  in the app (cards, cart, header, etc.) needs to change. */
  imageURL: string;

  /** Full image gallery for the product details page. Minimum 4 required
   *  when creating a product (enforced in the Add/Edit product page). */
  imageURLs: string[];

  price: number;
  stock: number;
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


