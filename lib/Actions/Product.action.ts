
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "../Firebase/client";
import { ProductType } from "@/types/Product";

import { auth } from "../Firebase/client"; // adjust if your path is different

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;


// ADD PRODUCT
export const addProduct = async (product: ProductType) => {
  try {
    const user = auth.currentUser;

    const isAdmin = user?.email === ADMIN_EMAIL;

    const productWithAuthor = {
      ...product,
      author: {
        isAdmin, // true or false
        Admin: isAdmin ? user?.displayName || "Admin" : "User",
        id: isAdmin ? user?.uid : "***",
        email: isAdmin ? user?.email : "***",
      },
      CreatedAt: Timestamp.now().toDate(),
    };

    await addDoc(collection(db, "PRODUCTS"), productWithAuthor);

    return {
      success: true,
      message: "Product Added Successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// GET SINGLE PRODUCT
export const getProduct = async (id: string) => {
  try {
    const docRef = doc(db, "PRODUCTS", id);

    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};


// UPDATE PRODUCT
export const updateProduct = async (
  id: string,
  product: ProductType
) => {
  try {
    const docRef = doc(db, "PRODUCTS", id);

    await setDoc(
      docRef,
      {
        ...product,
        EditedAt: Timestamp.now().toDate(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: "Product Updated Successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};