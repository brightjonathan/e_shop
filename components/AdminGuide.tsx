"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/Firebase/client";
import Loading from "./Loading";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/not-found");
        return;
      }

      user.getIdTokenResult(true).then((token) => { 
        //true = force refresh
        const isAdminClaim = token.claims.admin === true;
        const isAdminEmail = user.email ===  process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        if (!isAdminClaim && !isAdminEmail) {
          router.push("/not-found");
        } else {
          setLoading(false);
        }
      });
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <Loading />;

  return <>{children}</>;
}

