// lib/Actions/order.action.ts
"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import { OrderType, OrderStatus } from "@/types/Order";

// Checkout itself (stock validation, payment, order creation) lives
// server-side in app/api/checkout/initiate and app/api/checkout/verify,
// since it requires the Paystack secret key and must be trusted code.
//
// The admin write functions below run directly from the client — that's
// safe here because Firestore's security rules already gate every write
// to `orders` and `PRODUCTS` behind isAdmin(); the rule is the real
// security boundary, not where the code happens to run. Refunds are the
// one exception (see refundOrder below) since only Paystack's server
// API can move real money, and that needs the secret key.

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
    console.error("fetchOrder failed:", err);
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

// ── Admin mutations ──────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Moves an order forward through fulfillment (Confirmed, Processing,
 * Packed, Shipped, Out for Delivery, Delivered). Does NOT handle
 * Cancelled (needs stock restoration, see cancelOrder) or Refunded
 * (needs a real Paystack call, see refundOrder).
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: `Order marked as ${status}.` };
  } catch (err) {
    console.error("updateOrderStatus failed:", err);
    return { success: false, message: "Could not update order status." };
  }
};

/** Attaches a courier + tracking number to an order. */
export const addTrackingInfo = async (
  orderId: string,
  courier: string,
  trackingNumber: string
): Promise<ActionResult> => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      courier,
      trackingNumber,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: "Tracking info added." };
  } catch (err) {
    console.error("addTrackingInfo failed:", err);
    return { success: false, message: "Could not save tracking info." };
  }
};

/**
 * Cancels an order AND restores the stock that was reserved for it —
 * as one atomic transaction, so a cancel can never succeed while
 * silently failing to give the stock back (or vice versa).
 */
export const cancelOrder = async (order: OrderType): Promise<ActionResult> => {
  if (!order.id) return { success: false, message: "Missing order id." };

  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, "orders", order.id!);
      const productRefs = order.items.map((item) => doc(db, "PRODUCTS", item.id));
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

      productSnaps.forEach((snap, index) => {
        if (!snap.exists()) return; // product may have been deleted since
        const currentStock = snap.data()?.stock ?? 0;
        transaction.update(productRefs[index], {
          stock: currentStock + order.items[index].quantity,
        });
      });

      transaction.update(orderRef, {
        status: "Cancelled",
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true, message: "Order cancelled and stock restored." };
  } catch (err) {
    console.error("cancelOrder failed:", err);
    return { success: false, message: "Could not cancel order." };
  }
};

/**
 * Refunds an order via Paystack. This calls a server route because it
 * needs the Paystack secret key — money actually moves here, so this
 * one action can't safely run purely client-side.
 */
export const refundOrder = async (orderId: string, reason: string, idToken: string): Promise<ActionResult> => {
  try {
    const res = await fetch("/api/admin/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ orderId, reason }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch (err) {
    console.error("refundOrder failed:", err);
    return { success: false, message: "Could not process refund." };
  }
};


