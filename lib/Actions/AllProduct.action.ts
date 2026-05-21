// product.action.ts
// All Firebase product actions — fetch (latest first), delete

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../Firebase/client"; 
import { ProductType } from "@/types/Product";

export type ProductsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ProductType[] }
  | { status: "error"; message: string };

// ─── Fetch all products once (latest first) ───────────────────────────────────

export async function fetchProducts(): Promise<ProductType[]> {
  const q = query(
    collection(db, "PRODUCTS"),
    orderBy("createdAt", "desc") // newest product at the top
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<ProductType, "id">),
  }));
}

// ─── Real-time listener (latest first) ───────────────────────────────────────
// Returns an unsubscribe function — call it in useEffect cleanup.

export function subscribeToProducts(
  onData: (products: ProductType[]) => void,
  onError: (message: string) => void
): () => void {

//   console.log("Connected to Firebase project:", db.app.options.projectId);

  const unsubscribe = onSnapshot(
    collection(db, "PRODUCTS"),
    (snapshot) => {

      console.log("Document count:", snapshot.size);

      snapshot.forEach((doc) => {
        console.log("Doc ID:", doc.id);
        console.log("Doc Data:", doc.data());
      });

      const products: ProductType[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProductType, "id">),
      }));

      onData(products);
    },
    (error) => {
      console.error(error);
      onError(error.message);
    }
  );

  return unsubscribe;
}



// ─── Delete a product (Firestore doc + Storage image) ───

export async function deleteProduct(
  id: string,
  imageURL: string
): Promise<void> {
  // Delete Firestore document
  await deleteDoc(doc(db, "PRODUCTS", id));

  // Delete image from Storage (only if a URL exists)
  if (imageURL) {
    try {
      const storageRef = ref(storage, imageURL);
      await deleteObject(storageRef);
    } catch {
      // Image may already be deleted — safe to ignore
    }
  }
}
