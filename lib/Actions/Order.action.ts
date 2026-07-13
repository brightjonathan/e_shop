// lib/Actions/order.action.ts
"use client";

import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import { OrderType } from "@/types/Order";

// Checkout itself (stock validation, payment, order creation) now lives
// server-side in app/api/checkout/initiate and app/api/checkout/verify,
// since it requires the Paystack secret key and must be trusted code.
// This file only handles reading orders back out for display.

/** All orders belonging to one user, most recent first. */
export const fetchUserOrders = async (userId: string): Promise<OrderType[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderType));
  } catch (err) {
    console.error("fetchUserOrders failed:", err);
    return [];
  }
};

/** A single order by id — used for the confirmation/detail page. */
export const fetchOrder = async (orderId: string): Promise<OrderType | null> => {
  try {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as OrderType;
  } catch (err) {
    console.error("fetchOrder failed");
    return null;
  }
};

/** All orders, for the admin dashboard. */
export const fetchAllOrders = async (): Promise<OrderType[]> => {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderType));
  } catch (err) {
    console.error("fetchAllOrders failed:", err);
    return [];
  }
};






