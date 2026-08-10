"use client";

// app/admin-panel/sales/page.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fetchAllOrders } from "@/lib/Actions/Order.action";
import { OrderType } from "@/types/Order";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

type Range = "all" | "today" | "month";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const BackLink = () => (
  <Link href="/admin-panel" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
    Dashboard
  </Link>
);

export default function SalesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const range = (searchParams.get("range") as Range) || "all";

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

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

  const now = useMemo(() => new Date(), []);

  const filteredOrders = useMemo(() => {
    if (range === "today") {
      return orders.filter((o) => {
        const d = o.createdAt?.toDate?.();
        return d && isSameDay(d, now);
      });
    }
    if (range === "month") {
      return orders.filter((o) => {
        const d = o.createdAt?.toDate?.();
        return d && isSameMonth(d, now);
      });
    }
    return orders;
  }, [orders, range, now]);

  const total = filteredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const chartData = useMemo(() => {
    if (range === "today") {
      const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, total: 0 }));
      filteredOrders.forEach((o) => {
        const d = o.createdAt?.toDate?.();
        if (!d) return;
        hours[d.getHours()].total += o.total ?? 0;
      });
      return hours;
    }
    if (range === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), total: 0 }));
      filteredOrders.forEach((o) => {
        const d = o.createdAt?.toDate?.();
        if (!d) return;
        days[d.getDate() - 1].total += o.total ?? 0;
      });
      return days;
    }
    // All time — last 30 days
    const dayMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(5, 10), 0);
    }
    orders.forEach((o) => {
      const d = o.createdAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().slice(5, 10);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + (o.total ?? 0));
    });
    return Array.from(dayMap.entries()).map(([label, total]) => ({ label, total }));
  }, [filteredOrders, orders, range, now]);

  const setRange = (r: Range) => {
    router.push(r === "all" ? "/admin-panel/sales" : `/admin-panel/sales?range=${r}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 py-8 md:py-10 text-white">
      <div className="max-w-5xl mx-auto">
        <BackLink />

        <h1 className="text-2xl font-bold mb-1">Sales</h1>
        <p className="text-white/40 text-sm mb-6">
          {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
        </p>

        <div className="flex gap-2 mb-6">
          {([["all", "All Time"], ["today", "Today"], ["month", "This Month"]] as [Range, string][]).map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
                range === r ? "bg-[#fce3c7] text-black border-[#fce3c7]" : "bg-transparent text-white/60 border-white/10 hover:border-white/25 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 mb-6">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-2">
                {range === "today" ? "Today's Sales" : range === "month" ? "This Month's Revenue" : "Total Sales"}
              </p>
              <p className="text-3xl font-bold text-[#fce3c7]">{formatNaira(total)}</p>
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} interval={range === "today" ? 2 : "preserveStartEnd"} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v) => `₦${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: number) => formatNaira(v)}
                    contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  />
                  <Bar dataKey="total" fill="#fce3c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-12">No orders in this range.</p>
            ) : (
              <>
                <div className="hidden md:block bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                        <th className="text-left font-medium px-5 py-3">Order</th>
                        <th className="text-left font-medium px-5 py-3">Customer</th>
                        <th className="text-left font-medium px-5 py-3">Date</th>
                        <th className="text-right font-medium px-5 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3">
                            <Link href={`/admin-panel/orders/${order.id}`} className="text-white font-medium hover:text-[#fce3c7] transition-colors">
                              #{order.id?.slice(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-white/70">{order.shippingAddress?.fullName || order.userEmail}</td>
                          <td className="px-5 py-3 text-white/50">
                            {order.createdAt?.toDate?.().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-5 py-3 text-right text-[#fce3c7] font-semibold">{formatNaira(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden flex flex-col gap-3">
                  {filteredOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin-panel/orders/${order.id}`}
                      className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-semibold">#{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(order.total)}</p>
                      </div>
                      <p className="text-white/40 text-xs mt-1">
                        {order.shippingAddress?.fullName || order.userEmail} ·{" "}
                        {order.createdAt?.toDate?.().toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </p>
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
}