// lib/Actions/admin.action.ts
"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import { ProductType } from "@/types/Product";
import { OrderType } from "@/types/Order";

export interface DashboardStats {
  totalProducts: number;
  inStockCount: number; // stock >= 5
  lowStockCount: number; // 0 < stock < 5
  outOfStockCount: number; // stock === 0
  totalOrders: number; // paid orders only
  totalEarnings: number; // sum of paid orders' total
  earningsByDay: { date: string; total: number }[]; // last 14 days, for the chart
}

// NOTE: this fetches every product and every order client-side to compute
// stats — fine for a small-to-mid catalog/order volume. If this ever gets
// slow, the next step is either paginating, or precomputing these numbers
// server-side (e.g. a scheduled Cloud Function) instead of aggregating live.
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "PRODUCTS")),
    getDocs(collection(db, "orders")),
  ]);

  const products = productsSnap.docs.map((d) => d.data() as ProductType);
  const orders = ordersSnap.docs.map((d) => d.data() as OrderType);

  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
  const inStockCount = products.filter((p) => (p.stock ?? 0) >= 5).length;

  // Only paid orders count as real sales — unpaid/abandoned checkouts
  // shouldn't inflate earnings or the orders count.
  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");
  const totalEarnings = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalOrders = paidOrders.length;

  // Build the last 14 days as buckets, then fill in from paid orders
  const dayMap = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }

  paidOrders.forEach((order) => {
    const date = order.createdAt?.toDate?.();
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + (order.total ?? 0));
    }
  });

  const earningsByDay = Array.from(dayMap.entries()).map(([date, total]) => ({ date, total }));

  return {
    totalProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalOrders,
    totalEarnings,
    earningsByDay,
  };
};