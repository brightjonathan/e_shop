"use client";

// app/cart/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/Context/AppContextProvider";
import { CartItem } from "@/lib/Actions/Cart.action";

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// ── One row in the cart ──────────────────────────────────────
const CartRow: React.FC<{ item: CartItem }> = ({ item }) => {
  const { updateCartQuantity, removeFromCart } = useAppContext();
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/10">
      {/* Image */}
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
        {item.imageURL ? (
          <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
        ) : (
          <span className="text-2xl">🛍️</span>
        )}
      </div>

      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.productName}</p>
        <p className="text-white/40 text-xs mt-0.5">{formatNaira(item.price)} each</p>
        {item.quantity >= (item.stock ?? Infinity) && (
          <p className="text-amber-400 text-[11px] mt-0.5">Max available in stock</p>
        )}
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          aria-label={`Decrease quantity of ${item.productName}`}
        >
          <MinusIcon />
        </button>
        <span className="w-6 text-center text-white text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
          disabled={item.quantity >= (item.stock ?? Infinity)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
          aria-label={`Increase quantity of ${item.productName}`}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Line total */}
      <div className="w-24 text-right shrink-0">
        <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(lineTotal)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        aria-label={`Remove ${item.productName} from cart`}
      >
        <TrashIcon />
      </button>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────
const CartPage: React.FC = () => {
  const { cart, cartCount, cartTotal, cartSyncing, clearCart, user } = useAppContext();

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 md:px-12 lg:px-24 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Your Cart</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-white/40 hover:text-red-400 transition-colors"
            >
              Clear cart
            </button>
          )}
        </div>
        <p className="text-white/40 text-sm mb-6">
          {cartCount} item{cartCount === 1 ? "" : "s"}
        </p>

        {/* Sync status / guest notice */}
        {cartSyncing && (
          <div className="mb-4 text-xs text-white/50 bg-white/5 rounded-lg px-3 py-2">
            Syncing your cart…
          </div>
        )}
        {!user && cart.length > 0 && (
          <div className="mb-4 text-xs text-white/60 bg-[#fce3c7]/10 border border-[#fce3c7]/20 rounded-lg px-3 py-2">
            <Link href="/signin" className="text-[#fce3c7] underline underline-offset-2">
              Sign in
            </Link>{" "}
            to save this cart to your account and access it on any device.
          </div>
        )}

        {/* Empty state */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-4xl">🛒</span>
            <h3 className="text-white font-semibold">Your cart is empty</h3>
            <p className="text-white/40 text-sm">Add something you like from our products.</p>
            <Link
              href="/"
              className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-4">
              {cart.map((item) => (
                <CartRow key={item.id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-medium">{formatNaira(cartTotal)}</span>
              </div>
              <p className="text-white/30 text-xs">Shipping and taxes calculated at checkout.</p>
              <button
                type="button"
                className="mt-2 w-full bg-[#fce3c7] text-black font-semibold text-sm py-3 rounded-xl hover:bg-white transition-colors"
                onClick={() => alert("Checkout flow goes here")}
              >
                Checkout · {formatNaira(cartTotal)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;








