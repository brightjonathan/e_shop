"use client";

// app/checkout/callback/page.tsx
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/Context/AppContextProvider";

export default function CheckoutCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useAppContext();
  // Paystack sends back either "reference" or "trxref" depending on flow
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("Missing payment reference.");
      return;
    }

    fetch(`/api/checkout/verify?reference=${reference}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          // Server already cleared the cart in Firestore/localStorage's
          // source of truth — sync local state immediately too, so the
          // header badge and cart page don't show stale items.
          clearCart();
          setTimeout(() => router.push(`/orders/${data.orderId}`), 1200);
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment verification failed.");
        }
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Something went wrong verifying your payment.");
      });
  }, [reference, router, clearCart]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-white text-center px-4">
      {status === "verifying" && (
        <>
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <span className="text-4xl">✅</span>
          <p className="font-semibold">Payment successful! Redirecting…</p>
        </>
      )}
      {status === "failed" && (
        <>
          <span className="text-4xl">⚠️</span>
          <p className="font-semibold">Payment failed</p>
          <p className="text-white/50 text-sm">{message}</p>
          <button
            onClick={() => router.push("/cart")}
            className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
          >
            Back to Cart
          </button>
        </>
      )}
    </div>
  );
}