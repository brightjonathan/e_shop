"use client";

import { useEffect } from "react";

export function useReloadOnVisit(key: string = "pageReloaded") {
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem(key);

    if (!hasReloaded) {
      sessionStorage.setItem(key, "true");
      window.location.reload();
    }

    return () => {
      sessionStorage.removeItem(key);
    };
  }, [key]);
}