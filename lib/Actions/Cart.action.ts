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
  stock: number;
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

// ── Sync snapshot ────────────────────────────────────────────
// Stores what the cart looked like the last time it was successfully
// synced with a given account. This is the baseline used to figure out
// what's genuinely NEW in the local cart on the next sign-in (e.g. guest
// additions made after signing out) versus what's just an unchanged
// mirror of the cloud — without a baseline, a plain "add the quantities
// together" merge doubles the cart every time you log back in with no
// actual changes made.

export interface CartSyncSnapshot {
  uid: string;
  items: CartItem[];
}

const SNAPSHOT_KEY = "cart_synced_snapshot";

export const getSyncedSnapshot = (): CartSyncSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as CartSyncSnapshot) : null;
  } catch {
    return null;
  }
};

export const setSyncedSnapshot = (uid: string, items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ uid, items }));
};

/**
 * Reconciles a local cart with a cloud cart at sign-in time. For each
 * item: anything in the local cart BEYOND what the last synced snapshot
 * already accounted for is treated as a genuine new guest addition and
 * gets added on top of the cloud quantity. Anything unchanged since the
 * snapshot is NOT re-added — that's what stops a plain refresh/re-login
 * from doubling an already-synced cart.
 */
export const reconcileCartOnSignIn = (
  localItems: CartItem[],
  cloudItems: CartItem[],
  snapshotItems: CartItem[] | null
): CartItem[] => {
  const snapshotMap = new Map((snapshotItems ?? []).map((i) => [i.id, i.quantity]));
  const localMap = new Map(localItems.map((i) => [i.id, i]));
  const cloudMap = new Map(cloudItems.map((i) => [i.id, i]));
  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

  const result: CartItem[] = [];

  allIds.forEach((id) => {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);
    const snapshotQty = snapshotMap.get(id) ?? 0;
    const localQty = local?.quantity ?? 0;
    const cloudQty = cloud?.quantity ?? 0;

    const newlyAddedAsGuest = Math.max(0, localQty - snapshotQty);
    const finalQuantity = cloudQty + newlyAddedAsGuest;
    if (finalQuantity <= 0) return;

    const source = cloud ?? local!;
    result.push({
      id,
      productName: source.productName,
      imageURL: source.imageURL,
      price: source.price,
      stock: source.stock,
      quantity: Math.min(finalQuantity, source.stock ?? Infinity),
    });
  });

  return result;
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

  const stock = product.stock ?? 0;
  const existing = items.find((item) => item.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.id === product.id
        ? {
            ...item,
            // Keep stock fresh in case it changed since it was last added
            stock,
            quantity: Math.min(item.quantity + quantity, stock),
          }
        : item
    );
  }

  return [
    ...items,
    {
      id: product.id,
      productName: product.productName,
      imageURL: product.imageURL,
      price: product.price,
      stock,
      quantity: Math.min(quantity, stock),
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
  return items.map((item) =>
    item.id === productId
      ? { ...item, quantity: Math.min(quantity, item.stock ?? Infinity) }
      : item
  );
};

/** Combines two carts (e.g. a guest cart + a signed-in user's cloud cart), summing quantities for shared items. */
export const mergeCartItems = (a: CartItem[], b: CartItem[]): CartItem[] => {
  const merged = new Map<string, CartItem>();
  [...a, ...b].forEach((item) => {
    const existing = merged.get(item.id);
    merged.set(
      item.id,
      existing
        ? { ...existing, stock: item.stock, quantity: existing.quantity + item.quantity }
        : { ...item }
    );
  });
  // Clamp after summing, in case combined quantity now exceeds stock
  return Array.from(merged.values()).map((item) => ({
    ...item,
    quantity: Math.min(item.quantity, item.stock ?? Infinity),
  }));
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



