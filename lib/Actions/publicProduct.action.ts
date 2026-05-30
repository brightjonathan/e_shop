import {
  collection,
  getDocs,
  query,
  orderBy,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/Firebase/client"; 
import { ProductType } from "@/types/Product"; 


export interface FetchProductsResult {
  products: ProductType[];
  error: string | null;
}

/**
 * Fetch all products from Firestore "products" collection
 */
export const fetchAllProducts = async (): Promise<FetchProductsResult> => {
  try {
    const q = query(collection(db, "PRODUCTS"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const products: ProductType[] = snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { products, error: null };
  } catch (err: any) {
    // Fallback without ordering if index not created
    try {
      const snapshot = await getDocs(collection(db, "PRODUCTS"));
      const products: ProductType[] = snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return { products, error: null };
    } catch (fallbackErr: any) {
      return { products: [], error: fallbackErr.message };
    }
  }
};

/**
 * Filter products by search term (name or category)
 */
export const filterProducts = (
  products: ProductType[],
  searchTerm: string
): ProductType[] => {
  if (!searchTerm.trim()) return products;
  const lower = searchTerm.toLowerCase().trim();
  return products.filter(
    (p) =>
      p.productName?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower) ||
      p.brand?.toLowerCase().includes(lower)
  );
};

/**
 * Get paginated slice of products
 */
export const paginateProducts = (
  products: ProductType[],
  currentPage: number,
  perPage: number
): ProductType[] => {
  const start = (currentPage - 1) * perPage;
  return products.slice(start, start + perPage);
};

/**
 * Calculate total pages
 */
export const getTotalPages = (total: number, perPage: number): number =>
  Math.max(1, Math.ceil(total / perPage));

/**
 * Get unique categories from products list
 */
export const getCategories = (products: ProductType[]): string[] => {
  const cats = new Set(products.map((p) => p.category).filter(Boolean));
  return Array.from(cats).sort();
};

