"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/Firebase/client";
import Header from "@/components/Header";
import { useAppContext } from "@/Context/AppContextProvider";

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  productName: string;
  imageURL: string;
  imageURLs?: string[];
  price: number;
  stock?: number;
  category: string;
  brand: string;
  description: string;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-linear-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-size-[200%_100%] ${className}`}
      style={{ animation: "shimmer 1.6s infinite linear" }}
    />
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProductDetailsPage() {


  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useAppContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ── Fetch from Firebase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "PRODUCTS", id as string);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Product not found.");
          return;
        }

        const raw = { id: docSnap.id, ...docSnap.data() } as Product;

        // Older products only have a single imageURL — fall back to that
        // as a one-image gallery so this page works for them too.
        const normalized: Product = {
          ...raw,
          imageURLs:
            raw.imageURLs && raw.imageURLs.length > 0
              ? raw.imageURLs
              : raw.imageURL
              ? [raw.imageURL]
              : [],
          stock: raw.stock ?? 0,
        };

        setProduct(normalized);
        setSelectedImageIndex(0);
        setQuantity(1);
      } catch (err) {
        console.error(err);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ── Stock-aware helpers ──────────────────────────────────────────────────
  const stock = product?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const increaseQuantity = () => {
    setQuantity((q) => Math.min(stock, q + 1));
  };

  // ── Add to Cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 md:px-10">
        <style>{`
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>
        <Skeleton className="mb-10 h-8 w-28" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
          <div className="space-y-5 pt-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-14 flex-1" />
              <Skeleton className="h-14 w-14" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <svg className="h-9 w-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
          <p className="mt-2 text-zinc-500">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!product) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCT DISPLAY
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <Header/>
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .fade-up  { animation: fadeUp  0.5s ease forwards; }
        .scale-in { animation: scaleIn 0.45s ease forwards; }
      `}</style>

      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/25 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>

          <nav className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
            <span className="cursor-pointer hover:text-zinc-400" onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-zinc-400" onClick={() => router.back()}>Products</span>
            <span>/</span>
            <span className="max-w-40 truncate text-zinc-300">{product.productName}</span>
          </nav>

          <button
            onClick={() => setWishlist((w) => !w)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              wishlist
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill={wishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {wishlist ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── LEFT: Image Gallery ──────────────────────────────────────── */}
          <div className="scale-in">
            <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/5">
              {product.imageURLs && product.imageURLs.length > 0 ? (
                <Image
                  src={product.imageURLs[selectedImageIndex] ?? product.imageURL}
                  alt={product.productName}
                  width={700}
                  height={700}
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              ) : (
                /* fallback placeholder */
                <div className="flex aspect-square w-full items-center justify-center">
                  <svg className="h-20 w-20 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail strip — click to change the main image */}
            {product.imageURLs && product.imageURLs.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {product.imageURLs.map((url, index) => (
                  <button
                    key={url + index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Show image ${index + 1} of ${product.productName}`}
                    aria-current={selectedImageIndex === index}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? "ring-white opacity-100"
                        : "ring-white/10 opacity-60 hover:opacity-100 hover:ring-white/30"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${product.productName} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ──────────────────────────────────────── */}
          <div className="fade-up space-y-7 pt-2">
            {/* badges */}
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-400 ring-1 ring-white/10">
                  {product.category}
                </span>
              )}
              {product.brand && (
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-400 ring-1 ring-indigo-500/20">
                  {product.brand}
                </span>
              )}
            </div>

            {/* name */}
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
              {product.productName}
            </h1>

            {/* price */}
            <div className="flex items-end gap-4">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                &#8358;{product.price.toLocaleString("en-NG")}
              </span>
            </div>

            {/* stock indicator */}
            <p className={`text-sm font-medium ${
              isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-emerald-400"
            }`}>
              {isOutOfStock ? "Out of stock" : `${stock} in stock${isLowStock ? " — almost gone" : ""}`}
            </p>

            <div className="h-px bg-white/5" />

            {/* description */}
            <p className="leading-relaxed text-zinc-400">{product.description}</p>

            {/* quantity + CTA */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">Qty</span>
                <div className="flex items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-l-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-white">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    disabled={isOutOfStock || quantity >= stock}
                    className="flex h-10 w-10 items-center justify-center rounded-r-xl text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                    addedToCart
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-black hover:bg-zinc-100 active:scale-[0.98]"
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Added to Cart!
                    </>
                  ) : isOutOfStock ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigator.share?.({ title: product.productName, url: window.location.href })}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                  aria-label="Share"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", label: "Secure Payment" },
                { icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12", label: "Fast Delivery" },
                { icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99", label: "Easy Returns" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-white/3 p-3 text-center ring-1 ring-white/5">
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <span className="text-[11px] text-zinc-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  </>
  );
}




