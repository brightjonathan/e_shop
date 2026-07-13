"use client";

// app/checkout/page.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppContext } from "@/Context/AppContextProvider";

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard Shipping", fee: 2000, note: "3-5 business days" },
  { id: "express", label: "Express Shipping", fee: 5000, note: "1-2 business days" },
  { id: "pickup", label: "Store Pickup", fee: 0, note: "Ready in 24 hours" },
] as const;

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function CheckoutPage() {
  const { cart, cartTotal, user } = useAppContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<"standard" | "express" | "pickup">("standard");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: user?.email ?? "",
    country: "Nigeria",
    state: "",
    city: "",
    address: "",
    postalCode: "",
  });

  const shippingFee = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.fee ?? 0;
  const total = cartTotal + shippingFee;

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePayNow = async () => {
    if (!user) {
      toast.error("Please sign in to checkout.");
      router.push("/signin");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.state) {
      toast.error("Please fill in all shipping details.");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          shippingAddress: form,
          deliveryMethod: delivery,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Could not start checkout.");
        setLoading(false);
        return;
      }

      // Hand off to Paystack — they'll redirect back to /checkout/callback
      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 md:px-12 lg:px-24 py-10 text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* Shipping form */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white/80 mb-1">Shipping Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange("fullName")}
            />
            <input
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange("phone")}
            />
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
            placeholder="Email"
            value={form.email}
            onChange={handleChange("email")}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              placeholder="State"
              value={form.state}
              onChange={handleChange("state")}
            />
            <input
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              placeholder="City"
              value={form.city}
              onChange={handleChange("city")}
            />
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
            placeholder="Address"
            value={form.address}
            onChange={handleChange("address")}
          />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
            placeholder="Postal Code (optional)"
            value={form.postalCode}
            onChange={handleChange("postalCode")}
          />
        </div>

        {/* Delivery method */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white/80 mb-1">Delivery Method</h2>
          {DELIVERY_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                delivery === opt.id ? "border-[#fce3c7] bg-[#fce3c7]/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <input type="radio" name="delivery" checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-white/40">{opt.note}</p>
                </div>
              </div>
              <span className="text-sm text-[#fce3c7]">{opt.fee === 0 ? "Free" : formatNaira(opt.fee)}</span>
            </label>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span>{formatNaira(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Shipping</span>
            <span>{shippingFee === 0 ? "Free" : formatNaira(shippingFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 mt-2">
            <span>Total</span>
            <span className="text-[#fce3c7]">{formatNaira(total)}</span>
          </div>
        </div>

        <button
          onClick={handlePayNow}
          disabled={loading}
          className="w-full bg-[#fce3c7] text-black font-semibold py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? "Redirecting to Paystack…" : `Pay Now · ${formatNaira(total)}`}
        </button>
      </div>
    </div>
  );
}