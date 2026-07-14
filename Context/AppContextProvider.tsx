"use client";

import React, { createContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/Firebase/client";
import { ProductType } from "@/types/Product";
import {
  CartItem,
  loadCartFromStorage,
  persistCartToStorage,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  fetchCloudCart,
  saveCloudCart,
  getCartCount,
  getCartTotal,
  getSyncedSnapshot,
  setSyncedSnapshot,
  reconcileCartOnSignIn,
} from "@/lib/Actions/Cart.action";

interface AppContextParams {
  user: User | null;
  setUser: (user: User | null) => void;
  authLoading: boolean;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  cartSyncing: boolean;
  addToCart: (product: ProductType, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const AppContext = createContext<AppContextParams | undefined>(undefined);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSyncing, setCartSyncing] = useState(false);

  // Tracks which uid we've already pulled the cloud cart for, so a re-fire
  // of onAuthStateChanged for the same user doesn't re-merge every time.
  const syncedUidRef = useRef<string | null>(null);

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setAuthLoading(false); // first check has completed, either way
      if (!firebaseUser) {
        // Signed out — next sign-in should re-check against the last
        // synced snapshot (see the reconciliation effect below).
        syncedUidRef.current = null;
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Load the guest cart from localStorage once, on mount ────
  useEffect(() => {
    setCart(loadCartFromStorage());
  }, []);

  // ── On sign-in: reconcile the local cart with the cloud cart using
  //    the last synced snapshot as a baseline. This adds only what's
  //    GENUINELY new since that snapshot (e.g. guest items added after
  //    signing out) — an unchanged cart just loads the cloud copy as-is,
  //    so logging out and back in with no changes never inflates it ──
  useEffect(() => {
    if (!user || syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;

    setCartSyncing(true);
    fetchCloudCart(user.uid)
      .then((cloudItems) => {
        const snapshot = getSyncedSnapshot();
        const baseline = snapshot && snapshot.uid === user.uid ? snapshot.items : null;

        setCart((localItems) => {
          const reconciled = reconcileCartOnSignIn(localItems, cloudItems, baseline);
          saveCloudCart(user.uid, reconciled);
          setSyncedSnapshot(user.uid, reconciled);
          return reconciled;
        });
      })
      .finally(() => setCartSyncing(false));
  }, [user]);

  // ── Whenever the cart changes: always mirror to localStorage,
  //    and also push to Firestore if signed in ─────────────────
  useEffect(() => {
    persistCartToStorage(cart);
    if (user) {
      saveCloudCart(user.uid, cart);
      setSyncedSnapshot(user.uid, cart);
    }
  }, [cart, user]);

  // ── Cart mutators ──────────────────────────────────────────
  const addToCart = (product: ProductType, quantity: number = 1) => {
    setCart((prev) => addItemToCart(prev, product, quantity));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => removeItemFromCart(prev, productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => updateItemQuantity(prev, productId, quantity));
  };

  const clearCart = () => setCart([]);

  const value: AppContextParams = {
    user,
    setUser,
    authLoading,
    cart,
    cartCount: getCartCount(cart),
    cartTotal: getCartTotal(cart),
    cartSyncing,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextParams => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
};


