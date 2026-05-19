"use client";

import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/Firebase/client";

interface AppContextParams {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextParams | undefined>(undefined);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen for login/logout changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // console.log("User signed in:", firebaseUser.email);
        setUser(firebaseUser);
      } else {
        // console.log("User signed out");
        setUser(null);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    setUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextParams => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
};