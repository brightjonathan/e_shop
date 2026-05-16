"use client";

import { useAppContext } from "@/Context/AppContextProvider";

export const ShowOnLogin = ({ children }) => {
  const { user } = useAppContext();

  return user ? children : null;
};


export const ShowOnLogout = ({ children }) => {
  const { user } = useAppContext();

  return !user ? children : null;
};