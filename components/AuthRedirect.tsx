"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/Firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";


// This component is a route guard. Its purpose is to prevent logged-in users from accessing pages like Login or Register. If the user is already authenticated, it automatically redirects them to their profile page.

export default function AuthRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/user-profile");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return null;

  return <>{children}</>;
}