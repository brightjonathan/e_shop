"use client";

// app/admin-panel/orders/page.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { fetchAllOrders } from "@/lib/Actions/Order.action";
import { OrderType, OrderStatus } from "@/types/Order";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const formatDate = (order: OrderType) => {
  const date = order.createdAt?.toDate?.();
  if (!date) return "";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Packed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Out for Delivery": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  Refunded: "bg-white/10 text-white/50 border-white/15",
};

const FILTER_TABS: ("All" | OrderStatus)[] = [
  "All",
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const AdminOrdersPage: React.FC = () => {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status") as OrderStatus | null;

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | OrderStatus>(statusFromUrl ?? "All");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAllOrders().then((data) => {
      if (!cancelled) {
        setOrders(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the dashboard linked here with ?status=X, honor it on first load
  useEffect(() => {
    if (statusFromUrl) setActiveFilter(statusFromUrl);
  }, [statusFromUrl]);

  const visibleOrders = useMemo(() => {
    let result = orders;

    if (activeFilter !== "All") {
      result = result.filter((o) => o.status === activeFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.userEmail?.toLowerCase().includes(q) ||
          o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
          o.items.some((item) => item.productName.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.().getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.().getTime() ?? 0;
      return sortNewestFirst ? bTime - aTime : aTime - bTime;
    });
  }, [orders, activeFilter, search, sortNewestFirst]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 py-8 md:py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            {!loading && <p className="text-white/40 text-sm mt-1">{orders.length} total orders</p>}
          </div>

          {!loading && orders.length > 0 && (
            <button
              onClick={() => setSortNewestFirst((prev) => !prev)}
              className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-colors flex items-center gap-1.5"
            >
              {sortNewestFirst ? "Newest first" : "Oldest first"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={sortNewestFirst ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-4xl">🧾</span>
            <h3 className="text-white font-semibold">No orders yet</h3>
            <p className="text-white/40 text-sm">Orders will show up here once customers start checking out.</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, customer name, email, or product…"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
              {FILTER_TABS.map((tab) => {
                const count = countsByStatus[tab] ?? 0;
                if (tab !== "All" && count === 0) return null;
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-[#fce3c7] text-black border-[#fce3c7]"
                        : "bg-transparent text-white/60 border-white/10 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {tab} <span className={isActive ? "text-black/50" : "text-white/30"}>{count}</span>
                  </button>
                );
              })}
            </div>

            {visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-white/50 text-sm">No orders match your search.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                        <th className="text-left font-medium px-5 py-3">Order</th>
                        <th className="text-left font-medium px-5 py-3">Customer</th>
                        <th className="text-left font-medium px-5 py-3">Date</th>
                        <th className="text-left font-medium px-5 py-3">Items</th>
                        <th className="text-left font-medium px-5 py-3">Status</th>
                        <th className="text-right font-medium px-5 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleOrders.map((order) => (
                        <tr key={order.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3">
                            <Link href={`/admin-panel/orders/${order.id}`} className="text-white font-medium hover:text-[#fce3c7] transition-colors">
                              #{order.id?.slice(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-white/70 max-w-[180px] truncate">
                            {order.shippingAddress?.fullName || order.userEmail}
                          </td>
                          <td className="px-5 py-3 text-white/50">{formatDate(order)}</td>
                          <td className="px-5 py-3 text-white/50">{order.items.length}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-5 py-3 text-right text-[#fce3c7] font-semibold">{formatNaira(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {visibleOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin-panel/orders/${order.id}`}
                      className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white text-sm font-semibold">#{order.id?.slice(0, 8).toUpperCase()}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-white/60 text-xs truncate mb-1">
                        {order.shippingAddress?.fullName || order.userEmail}
                      </p>
                      <div className="flex items-center gap-2 mb-2 mt-2">
                        {order.items.slice(0, 4).map((item, i) => (
                          <div key={item.id + i} className="relative w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            {item.imageURL ? (
                              <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
                            ) : (
                              <span className="flex items-center justify-center h-full text-xs">🛍️</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <p className="text-white/40 text-xs">{formatDate(order)}</p>
                        <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(order.total)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;