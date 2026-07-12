// lib/Actions/cart.action.ts
"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import { ProductType } from "@/types/Product";

// ── Types ──────────────────────────────────────────────────
export interface CartItem {
  id: string;
  productName: string;
  imageURL: string;
  price: number;
  quantity: number;
}

const CART_STORAGE_KEY = "cart_items";

// ── Persistence ────────────────────────────────────────────

/** Reads the cart from localStorage. Safe to call on the server (returns []). */
export const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    // Corrupt/unreadable data shouldn't crash the app — just start fresh
    return [];
  }
};

/** Writes the cart to localStorage. No-op on the server. */
export const persistCartToStorage = (items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

// ── Pure reducers (take current items, return new items) ───
// Kept side-effect-free so AppContextProvider owns persistence/state.

export const addItemToCart = (
  items: CartItem[],
  product: ProductType,
  quantity: number = 1
): CartItem[] => {
  if (!product.id) {
    // Shouldn't happen for fetched products, but guard rather than crash
    console.warn("addItemToCart: product is missing an id", product);
    return items;
  }

  const existing = items.find((item) => item.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
    );
  }

  return [
    ...items,
    {
      id: product.id,
      productName: product.productName,
      imageURL: product.imageURL,
      price: product.price,
      quantity,
    },
  ];
};

export const removeItemFromCart = (items: CartItem[], productId: string): CartItem[] =>
  items.filter((item) => item.id !== productId);

export const updateItemQuantity = (
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] => {
  if (quantity <= 0) return removeItemFromCart(items, productId);
  return items.map((item) => (item.id === productId ? { ...item, quantity } : item));
};

/** Combines two carts (e.g. a guest cart + a signed-in user's cloud cart), summing quantities for shared items. */
export const mergeCartItems = (a: CartItem[], b: CartItem[]): CartItem[] => {
  const merged = new Map<string, CartItem>();
  [...a, ...b].forEach((item) => {
    const existing = merged.get(item.id);
    merged.set(
      item.id,
      existing ? { ...existing, quantity: existing.quantity + item.quantity } : { ...item }
    );
  });
  return Array.from(merged.values());
};

// ── Derived values ─────────────────────────────────────────

export const getCartCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const getCartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// ── Cloud sync (Firestore) ──────────────────────────────────
// Cart for a signed-in user lives at carts/{uid} so it follows them
// across devices. Guest (signed-out) carts stay in localStorage only.
//
// NOTE: this assumes `@/lib/Firebase/client` exports a Firestore
// instance named `db` (alongside the `auth` export you already use).
// If yours is named differently, update the import above.

export const fetchCloudCart = async (uid: string): Promise<CartItem[]> => {
  try {
    const snap = await getDoc(doc(db, "carts", uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.items) ? (data.items as CartItem[]) : [];
  } catch (err) {
    console.error("fetchCloudCart failed:", err);
    return [];
  }
};

export const saveCloudCart = async (uid: string, items: CartItem[]): Promise<void> => {
  try {
    await setDoc(doc(db, "carts", uid), { items, updatedAt: Date.now() });
  } catch (err) {
    console.error("saveCloudCart failed:", err);
  }
};