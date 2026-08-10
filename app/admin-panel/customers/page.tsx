"use client";

// app/admin-panel/customers/page.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAllOrders } from "@/lib/Actions/Order.action";
import { OrderType } from "@/types/Order";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

interface CustomerSummary {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
}

type SortBy = "spent" | "orders" | "recent";

export default function CustomersPage() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("spent");

  useEffect(() => {
    let cancelled = false;
    fetchAllOrders().then((data) => {
      if (!cancelled) {
        setOrders(data.filter((o) => o.paymentStatus === "Paid"));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();
    orders.forEach((o) => {
      const date = o.createdAt?.toDate?.();
      const existing = map.get(o.userId);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += o.total ?? 0;
        if (date && (!existing.lastOrderDate || date > existing.lastOrderDate)) existing.lastOrderDate = date;
      } else {
        map.set(o.userId, {
          userId: o.userId,
          name: o.shippingAddress?.fullName || "Unknown",
          email: o.userEmail || "",
          orderCount: 1,
          totalSpent: o.total ?? 0,
          lastOrderDate: date,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const visible = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      return (b.lastOrderDate?.getTime() ?? 0) - (a.lastOrderDate?.getTime() ?? 0);
    });
  }, [customers, search, sortBy]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 py-8 md:py-10 text-white">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin-panel" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-1">Customers</h1>
        <p className="text-white/40 text-sm mb-6">
          {customers.length} customer{customers.length === 1 ? "" : "s"} · based on paid order history
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-24">No customers yet.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70"
              >
                <option value="spent">Sort: Highest Spent</option>
                <option value="orders">Sort: Most Orders</option>
                <option value="recent">Sort: Most Recent</option>
              </select>
            </div>

            <div className="hidden md:block bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                    <th className="text-left font-medium px-5 py-3">Customer</th>
                    <th className="text-left font-medium px-5 py-3">Email</th>
                    <th className="text-left font-medium px-5 py-3">Orders</th>
                    <th className="text-left font-medium px-5 py-3">Last Order</th>
                    <th className="text-right font-medium px-5 py-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.userId} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                      <td className="px-5 py-3">
                        <Link href={`/admin-panel/orders?search=${encodeURIComponent(c.email)}`} className="text-white/60 hover:text-[#fce3c7] transition-colors">
                          {c.email}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-white/60">{c.orderCount}</td>
                      <td className="px-5 py-3 text-white/50">
                        {c.lastOrderDate?.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-right text-[#fce3c7] font-semibold">{formatNaira(c.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col gap-3">
              {visible.map((c) => (
                <Link
                  key={c.userId}
                  href={`/admin-panel/orders?search=${encodeURIComponent(c.email)}`}
                  className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                >
                  <p className="text-white text-sm font-semibold">{c.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{c.email}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <p className="text-white/50 text-xs">
                      {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                    </p>
                    <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(c.totalSpent)}</p>
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