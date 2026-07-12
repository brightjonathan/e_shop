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
  mergeCartItems,
  fetchCloudCart,
  saveCloudCart,
  getCartCount,
  getCartTotal,
} from "@/lib/Actions/Cart.action";

interface AppContextParams {
  user: User | null;
  setUser: (user: User | null) => void;

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSyncing, setCartSyncing] = useState(false);

  // Tracks which uid we've already pulled the cloud cart for, so a re-fire
  // of onAuthStateChanged for the same user doesn't re-merge every time.
  const syncedUidRef = useRef<string | null>(null);

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (!firebaseUser) {
        // Signed out — next sign-in (even same user) should re-merge/re-fetch
        syncedUidRef.current = null;
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Load the guest cart from localStorage once, on mount ────
  useEffect(() => {
    setCart(loadCartFromStorage());
  }, []);

  // ── On sign-in: pull the user's cloud cart and merge with guest cart ─
  useEffect(() => {
    if (!user || syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;

    setCartSyncing(true);
    fetchCloudCart(user.uid)
      .then((cloudItems) => {
        setCart((guestItems) => {
          const merged = mergeCartItems(guestItems, cloudItems);
          // Persist the merged result back up immediately so the cloud
          // reflects whatever the guest had before signing in.
          saveCloudCart(user.uid, merged);
          return merged;
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







// "use client";

// import React, { createContext, useEffect, useState } from "react";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/lib/Firebase/client";

// interface AppContextParams {
//   user: User | null;
//   setUser: (user: User | null) => void;
// }

// const AppContext = createContext<AppContextParams | undefined>(undefined);

// export const AppContextProvider = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     // Listen for login/logout changes
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       if (firebaseUser) {
//         // console.log("User signed in:", firebaseUser.email);
//         setUser(firebaseUser);
//       } else {
//         // console.log("User signed out");
//         setUser(null);
//       }
//     });

//     // Cleanup listener on unmount
//     return () => unsubscribe();
//   }, []);

//   const value = {
//     user,
//     setUser,
//   };

//   return (
//     <AppContext.Provider value={value}>
//       {children}
//     </AppContext.Provider>
//   );
// };

// export const useAppContext = (): AppContextParams => {
//   const context = React.useContext(AppContext);
//   if (!context) {
//     throw new Error("useAppContext must be used within AppContextProvider");
//   }
//   return context;
// };




