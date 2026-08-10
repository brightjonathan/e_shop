"use client";

// components/Admin/StockTierPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { fetchProductsByStockTier, StockTier } from "@/lib/Actions/admin.action";
import { ProductType } from "@/types/Product";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const TIER_META: Record<StockTier, { title: string; accent: string; icon: string; empty: string }> = {
  "in-stock": { title: "In Stock Products", accent: "text-emerald-400", icon: "✅", empty: "No products currently in stock." },
  "low-stock": { title: "Low Stock Products", accent: "text-amber-400", icon: "⚠️", empty: "No products are running low." },
  "out-of-stock": { title: "Out of Stock Products", accent: "text-red-400", icon: "🚫", empty: "No products are out of stock." },
};

const PIE_COLORS = ["#fce3c7", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#38bdf8"];

export default function StockTierPage({ tier }: { tier: StockTier }) {
  const meta = TIER_META[tier];
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductsByStockTier(tier).then((data) => {
      if (!cancelled) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tier]);

  const visible = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.productName.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  // Category breakdown WITHIN this stock tier — the pie chart context
  // for these pages specifically (distinct from the dashboard's overall
  // in/low/out-of-stock split, which lives on the main dashboard instead).
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 py-8 md:py-10 text-white">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin-panel" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{meta.icon}</span>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
        </div>
        <p className={`text-sm mb-6 ${meta.accent}`}>
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-24">{meta.empty}</p>
        ) : (
          <>
            {categoryData.length > 1 && (
              <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-white/70 mb-4">By Category</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0f0f0f" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v} product${v === 1 ? "" : "s"}`, name]}
                      contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {categoryData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-white/50 text-xs">
                        {entry.name} <span className="text-white font-medium">({entry.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25 mb-6"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visible.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin-panel/edit-product/${p.id}`}
                  className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="relative aspect-square bg-white/5">
                    {p.imageURL ? (
                      <Image src={p.imageURL} alt={p.productName} fill className="object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-2xl">🛍️</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-medium truncate">{p.productName}</p>
                    <p className="text-white/40 text-[11px] mt-0.5">{p.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-semibold ${meta.accent}`}>{p.stock ?? 0} in stock</span>
                      <span className="text-white/50 text-xs">{formatNaira(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}