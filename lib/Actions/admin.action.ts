// lib/Actions/admin.action.ts
"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import { ProductType } from "@/types/Product";
import { OrderType } from "@/types/Order";

export interface BestSellingProduct {
  id: string;
  productName: string;
  imageURL: string;
  unitsSold: number;
  revenue: number;
}

export interface BestSellingCategory {
  category: string;
  unitsSold: number;
  revenue: number;
}

export interface DashboardStats {
  // Sales
  totalSales: number;
  todaysSales: number;
  monthlyRevenue: number;
  earningsByDay: { date: string; total: number }[]; // last 14 days, for the chart

  // Orders (paid orders only — see note below)
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  // Products / stock
  totalProducts: number;
  inStockCount: number; // stock >= 5
  lowStockCount: number; // 0 < stock < 5
  outOfStockCount: number; // stock === 0

  // Customers
  totalCustomers: number;

  // Lists
  recentOrders: OrderType[];
  bestSellingProducts: BestSellingProduct[];
  bestSellingCategories: BestSellingCategory[];
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// NOTE: this fetches every product and every order client-side to compute
// stats — fine for a small-to-mid catalog/order volume. If this ever gets
// slow, the next step is either paginating, or precomputing these numbers
// server-side (e.g. a scheduled Cloud Function) instead of aggregating live.
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "PRODUCTS")),
    getDocs(collection(db, "orders")),
  ]);

  const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductType));
  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderType));

  // ── Stock ──
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
  const inStockCount = products.filter((p) => (p.stock ?? 0) >= 5).length;

  // Only paid orders count as real, fulfillable sales — unpaid/abandoned
  // checkouts shouldn't inflate any of the numbers below.
  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");

  const now = new Date();
  const totalSales = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const todaysSales = paidOrders
    .filter((o) => {
      const d = o.createdAt?.toDate?.();
      return d && isSameDay(d, now);
    })
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const monthlyRevenue = paidOrders
    .filter((o) => {
      const d = o.createdAt?.toDate?.();
      return d && isSameMonth(d, now);
    })
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const totalOrders = paidOrders.length;
  const pendingOrders = paidOrders.filter((o) => o.status === "Pending").length;
  const deliveredOrders = paidOrders.filter((o) => o.status === "Delivered").length;
  const cancelledOrders = paidOrders.filter((o) => o.status === "Cancelled").length;

  // Distinct customers who have placed at least one PAID order.
  // NOTE: this counts customers by order history, not total registered
  // accounts — your `users` collection's Firestore rule currently only
  // allows owner-read (not admin-read), so this client-side fetch can't
  // list every signed-up account. If you want a true "everyone who
  // signed up, purchased or not" count later, add an admin-read clause
  // to the /users rule and fetch that collection directly instead.
  const totalCustomers = new Set(paidOrders.map((o) => o.userId)).size;

  // ── Earnings chart — last 14 days ──
  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
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

  // ── Recent orders — latest 5, newest first ──
  const recentOrders = [...paidOrders]
    .sort((a, b) => (b.createdAt?.toDate?.().getTime() ?? 0) - (a.createdAt?.toDate?.().getTime() ?? 0))
    .slice(0, 5);

  // ── Best selling products & categories ──
  // Category comes from the live product doc (order items don't store
  // category directly) — falls back gracefully if a product was deleted
  // since the order was placed.
  const productCategoryMap = new Map(products.map((p) => [p.id, p.category ?? "Uncategorized"]));

  const productTotals = new Map<string, BestSellingProduct>();
  const categoryTotals = new Map<string, BestSellingCategory>();

  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existingProduct = productTotals.get(item.id);
      productTotals.set(item.id, {
        id: item.id,
        productName: item.productName,
        imageURL: item.imageURL,
        unitsSold: (existingProduct?.unitsSold ?? 0) + item.quantity,
        revenue: (existingProduct?.revenue ?? 0) + item.price * item.quantity,
      });

      const category = productCategoryMap.get(item.id) ?? "Uncategorized";
      const existingCategory = categoryTotals.get(category);
      categoryTotals.set(category, {
        category,
        unitsSold: (existingCategory?.unitsSold ?? 0) + item.quantity,
        revenue: (existingCategory?.revenue ?? 0) + item.price * item.quantity,
      });
    });
  });

  const bestSellingProducts = Array.from(productTotals.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const bestSellingCategories = Array.from(categoryTotals.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  return {
    totalSales,
    todaysSales,
    monthlyRevenue,
    earningsByDay,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalCustomers,
    recentOrders,
    bestSellingProducts,
    bestSellingCategories,
  };
};




// // lib/Actions/admin.action.ts
// "use client";

// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/lib/Firebase/client";
// import { ProductType } from "@/types/Product";
// import { OrderType } from "@/types/Order";

// export interface BestSellingProduct {
//   id: string;
//   productName: string;
//   imageURL: string;
//   unitsSold: number;
//   revenue: number;
// }

// export interface BestSellingCategory {
//   category: string;
//   unitsSold: number;
//   revenue: number;
// }

// export interface DashboardStats {
//   // Sales
//   totalSales: number;
//   todaysSales: number;
//   monthlyRevenue: number;
//   earningsByDay: { date: string; total: number }[]; // last 14 days, for the chart

//   // Orders (paid orders only — see note below)
//   totalOrders: number;
//   pendingOrders: number;
//   deliveredOrders: number;
//   cancelledOrders: number;

//   // Products / stock
//   totalProducts: number;
//   inStockCount: number; // stock >= 5
//   lowStockCount: number; // 0 < stock < 5
//   outOfStockCount: number; // stock === 0

//   // Customers
//   totalCustomers: number;

//   // Lists
//   recentOrders: OrderType[];
//   bestSellingProducts: BestSellingProduct[];
//   bestSellingCategories: BestSellingCategory[];
// }

// const isSameDay = (a: Date, b: Date) =>
//   a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// const isSameMonth = (a: Date, b: Date) =>
//   a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// // NOTE: this fetches every product and every order client-side to compute
// // stats — fine for a small-to-mid catalog/order volume. If this ever gets
// // slow, the next step is either paginating, or precomputing these numbers
// // server-side (e.g. a scheduled Cloud Function) instead of aggregating live.
// export const fetchDashboardStats = async (): Promise<DashboardStats> => {
//   const [productsSnap, ordersSnap] = await Promise.all([
//     getDocs(collection(db, "PRODUCTS")),
//     getDocs(collection(db, "orders")),
//   ]);

//   const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductType));
//   const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderType));

//   // ── Stock ──
//   const totalProducts = products.length;
//   const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
//   const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
//   const inStockCount = products.filter((p) => (p.stock ?? 0) >= 5).length;

//   // Only paid orders count as real, fulfillable sales — unpaid/abandoned
//   // checkouts shouldn't inflate any of the numbers below.
//   const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");

//   const now = new Date();
//   const totalSales = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

//   const todaysSales = paidOrders
//     .filter((o) => {
//       const d = o.createdAt?.toDate?.();
//       return d && isSameDay(d, now);
//     })
//     .reduce((sum, o) => sum + (o.total ?? 0), 0);

//   const monthlyRevenue = paidOrders
//     .filter((o) => {
//       const d = o.createdAt?.toDate?.();
//       return d && isSameMonth(d, now);
//     })
//     .reduce((sum, o) => sum + (o.total ?? 0), 0);

//   const totalOrders = paidOrders.length;
//   const pendingOrders = paidOrders.filter((o) => o.status === "Pending").length;
//   const deliveredOrders = paidOrders.filter((o) => o.status === "Delivered").length;
//   const cancelledOrders = paidOrders.filter((o) => o.status === "Cancelled").length;

//   // Distinct customers who have placed at least one PAID order.
//   // NOTE: this counts customers by order history, not total registered
//   // accounts — your `users` collection's Firestore rule currently only
//   // allows owner-read (not admin-read), so this client-side fetch can't
//   // list every signed-up account. If you want a true "everyone who
//   // signed up, purchased or not" count later, add an admin-read clause
//   // to the /users rule and fetch that collection directly instead.
//   const totalCustomers = new Set(paidOrders.map((o) => o.userId)).size;

//   // ── Earnings chart — last 14 days ──
//   const dayMap = new Map<string, number>();
//   for (let i = 13; i >= 0; i--) {
//     const d = new Date(now);
//     d.setDate(d.getDate() - i);
//     dayMap.set(d.toISOString().slice(0, 10), 0);
//   }
//   paidOrders.forEach((order) => {
//     const date = order.createdAt?.toDate?.();
//     if (!date) return;
//     const key = date.toISOString().slice(0, 10);
//     if (dayMap.has(key)) {
//       dayMap.set(key, (dayMap.get(key) ?? 0) + (order.total ?? 0));
//     }
//   });
//   const earningsByDay = Array.from(dayMap.entries()).map(([date, total]) => ({ date, total }));

//   // ── Recent orders — latest 5, newest first ──
//   const recentOrders = [...paidOrders]
//     .sort((a, b) => (b.createdAt?.toDate?.().getTime() ?? 0) - (a.createdAt?.toDate?.().getTime() ?? 0))
//     .slice(0, 5);

//   // ── Best selling products & categories ──
//   // Category comes from the live product doc (order items don't store
//   // category directly) — falls back gracefully if a product was deleted
//   // since the order was placed.
//   const productCategoryMap = new Map(products.map((p) => [p.id, p.category ?? "Uncategorized"]));

//   const productTotals = new Map<string, BestSellingProduct>();
//   const categoryTotals = new Map<string, BestSellingCategory>();

//   paidOrders.forEach((order) => {
//     order.items.forEach((item) => {
//       const existingProduct = productTotals.get(item.id);
//       productTotals.set(item.id, {
//         id: item.id,
//         productName: item.productName,
//         imageURL: item.imageURL,
//         unitsSold: (existingProduct?.unitsSold ?? 0) + item.quantity,
//         revenue: (existingProduct?.revenue ?? 0) + item.price * item.quantity,
//       });

//       const category = productCategoryMap.get(item.id) ?? "Uncategorized";
//       const existingCategory = categoryTotals.get(category);
//       categoryTotals.set(category, {
//         category,
//         unitsSold: (existingCategory?.unitsSold ?? 0) + item.quantity,
//         revenue: (existingCategory?.revenue ?? 0) + item.price * item.quantity,
//       });
//     });
//   });

//   const bestSellingProducts = Array.from(productTotals.values())
//     .sort((a, b) => b.unitsSold - a.unitsSold)
//     .slice(0, 5);

//   const bestSellingCategories = Array.from(categoryTotals.values())
//     .sort((a, b) => b.unitsSold - a.unitsSold)
//     .slice(0, 5);

//   return {
//     totalSales,
//     todaysSales,
//     monthlyRevenue,
//     earningsByDay,
//     totalOrders,
//     pendingOrders,
//     deliveredOrders,
//     cancelledOrders,
//     totalProducts,
//     inStockCount,
//     lowStockCount,
//     outOfStockCount,
//     totalCustomers,
//     recentOrders,
//     bestSellingProducts,
//     bestSellingCategories,
//   };
// };



