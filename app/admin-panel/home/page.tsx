"use client";

// app/admin-panel/page.tsx
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchDashboardStats, DashboardStats, subscribeToRecentOrders } from "@/lib/Actions/admin.action";
import { OrderType, OrderStatus } from "@/types/Order";
import { playNotificationSound } from "@/lib/Actions/playNotificationSound";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const formatDate = (d?: Date) =>
  d ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "";

// ── Stat card — a Link, same visual design throughout ────────
const StatCard: React.FC<{
  label: string;
  value: string;
  accent?: string;
  icon: string;
  href: string;
}> = ({ label, value, accent = "text-white", icon, href }) => (
  <Link
    href={href}
    className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#131313] transition-colors"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-white/40 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
  </Link>
);

const STATUS_DOT: Record<OrderStatus, string> = {
  Pending: "bg-amber-400",
  Confirmed: "bg-blue-400",
  Processing: "bg-blue-400",
  Packed: "bg-indigo-400",
  Shipped: "bg-indigo-400",
  "Out for Delivery": "bg-indigo-400",
  Delivered: "bg-emerald-400",
  Cancelled: "bg-red-400",
  Refunded: "bg-white/40",
};

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const LAST_SEEN_KEY = "admin_notifications_last_seen_at";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  // Live notification state — separate from `stats`, since this needs to
  // react in real time (new order arrives while the page is open), not
  // just reflect a one-time snapshot taken on load.
  const [liveOrders, setLiveOrders] = useState<OrderType[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const isInitialLoadRef = useRef(true);
  const topOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardStats().then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live subscription for the notification bell — detects orders that
  // arrive AFTER the initial load and reacts with a sound + badge count,
  // which a one-time fetch can never do.
  useEffect(() => {
    const unsubscribe = subscribeToRecentOrders((orders) => {
      setLiveOrders(orders);

      if (isInitialLoadRef.current) {
        // First callback is just the existing state — no sound here.
        isInitialLoadRef.current = false;
        topOrderIdRef.current = orders[0]?.id ?? null;

        const lastSeenAt = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
        const unseen = orders.filter((o) => {
          const t = o.createdAt?.toDate?.()?.getTime() ?? 0;
          return t > lastSeenAt;
        }).length;
        setUnseenCount(unseen);
        return;
      }

      // A genuinely new order landed at the top since last callback
      if (orders[0]?.id && orders[0].id !== topOrderIdRef.current) {
        topOrderIdRef.current = orders[0].id;
        setUnseenCount((prev) => prev + 1);
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleNotifications = () => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        // Opening the panel marks everything as seen
        localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
        setUnseenCount(0);
      }
      return next;
    });
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = stats.earningsByDay.map((d) => ({
    date: d.date.slice(5), // MM-DD, shorter for the x-axis
    total: d.total,
  }));

  const stockData = [
    { name: "In Stock", value: stats.inStockCount, color: "#34d399" },
    { name: "Low Stock", value: stats.lowStockCount, color: "#fbbf24" },
    { name: "Out of Stock", value: stats.outOfStockCount, color: "#f87171" },
  ];
  const totalStockItems = stockData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 md:px-12 py-10 text-white">
      {/* Header + notifications action */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2 transition-colors"
          >
            <BellIcon />
            Notifications
            {unseenCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#fce3c7] text-black text-[11px] font-bold leading-none">
                +{unseenCount > 99 ? "99" : unseenCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">Recent Notifications</p>
                <p className="text-white/30 text-[11px] mt-0.5">Live — updates as new orders come in</p>
              </div>
              {liveOrders.length === 0 ? (
                <p className="text-white/40 text-sm px-4 py-6 text-center">No recent activity.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {liveOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin-panel/orders/${order.id}`}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[order.status]}`} />
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          New order #{order.id?.slice(0, 8).toUpperCase()} — {formatNaira(order.total)}
                        </p>
                        <p className="text-white/40 text-[11px] mt-0.5">
                          {formatDate(order.createdAt?.toDate?.())} · {order.status}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sales" value={formatNaira(stats.totalSales)} accent="text-[#fce3c7]" icon="💰" href="/admin-panel/sales" />
        <StatCard label="Today's Sales" value={formatNaira(stats.todaysSales)} accent="text-[#fce3c7]" icon="📅" href="/admin-panel/sales?range=today" />
        <StatCard label="Monthly Revenue" value={formatNaira(stats.monthlyRevenue)} accent="text-[#fce3c7]" icon="📈" href="/admin-panel/sales?range=month" />
        <StatCard label="Total Orders" value={String(stats.totalOrders)} icon="🧾" href="/admin-panel/orders" />

        <StatCard label="Pending Orders" value={String(stats.pendingOrders)} accent="text-amber-400" icon="⏳" href="/admin-panel/orders?status=Pending" />
        <StatCard label="Delivered Orders" value={String(stats.deliveredOrders)} accent="text-emerald-400" icon="📦" href="/admin-panel/orders?status=Delivered" />
        <StatCard label="Cancelled Orders" value={String(stats.cancelledOrders)} accent="text-red-400" icon="✕" href="/admin-panel/orders?status=Cancelled" />
        <StatCard label="Total Customers" value={String(stats.totalCustomers)} icon="👥" href="/admin-panel/customers" />

        <StatCard label="Total Products" value={String(stats.totalProducts)} icon="🗂️" href="/admin-panel/all-products" />
        <StatCard label="In Stock" value={String(stats.inStockCount)} accent="text-emerald-400" icon="✅" href="/admin-panel/products/in-stock" />
        <StatCard label="Low Stock (< 5)" value={String(stats.lowStockCount)} accent="text-amber-400" icon="⚠️" href="/admin-panel/products/low-stock" />
        <StatCard label="Out of Stock" value={String(stats.outOfStockCount)} accent="text-red-400" icon="🚫" href="/admin-panel/products/out-of-stock" />
      </div>

      {/* Sales chart */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-white/70 mb-4">Sales — Last 14 Days</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fce3c7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fce3c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v) => `₦${v / 1000}k`} />
            <Tooltip
              formatter={(value: number) => formatNaira(value)}
              contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="total" stroke="#fce3c7" fill="url(#earningsFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders + Best Selling Products */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70">Recent Orders</h2>
            <Link href="/admin-panel/orders" className="text-xs text-white/40 hover:text-white transition-colors">
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-white/40 text-sm py-6 text-center">No orders yet.</p>
          ) : (
            <div className="flex flex-col">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin-panel/orders/${order.id}`}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status]}`} />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">#{order.id?.slice(0, 8).toUpperCase()}</p>
                      <p className="text-white/40 text-[11px]">{formatDate(order.createdAt?.toDate?.())}</p>
                    </div>
                  </div>
                  <p className="text-[#fce3c7] text-sm font-semibold shrink-0">{formatNaira(order.total)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Best Selling Products</h2>
          {stats.bestSellingProducts.length === 0 ? (
            <p className="text-white/40 text-sm py-6 text-center">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.bestSellingProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-white/30 text-xs font-semibold w-4 shrink-0">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    {p.imageURL ? (
                      <Image src={p.imageURL} alt={p.productName} fill className="object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs">🛍️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{p.productName}</p>
                    <p className="text-white/40 text-[11px]">{p.unitsSold} sold</p>
                  </div>
                  <p className="text-[#fce3c7] text-xs font-semibold shrink-0">{formatNaira(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Best Selling Categories + Stock Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Best Selling Categories</h2>
          {stats.bestSellingCategories.length === 0 ? (
            <p className="text-white/40 text-sm py-6 text-center">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.bestSellingCategories.map((c) => {
                const maxUnits = stats.bestSellingCategories[0]?.unitsSold || 1;
                const widthPct = Math.max(6, (c.unitsSold / maxUnits) * 100);
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-xs font-medium">{c.category}</p>
                      <p className="text-white/40 text-[11px]">
                        {c.unitsSold} sold · {formatNaira(c.revenue)}
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#fce3c7] rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock Breakdown — real pie chart, actual counts */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Stock Breakdown</h2>
          {totalStockItems === 0 ? (
            <p className="text-white/40 text-sm py-16 text-center">No products yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stockData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {stockData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#0f0f0f" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} product${value === 1 ? "" : "s"}`, name]}
                    contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-5 mt-2">
                {stockData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-white/50 text-xs">
                      {entry.name} <span className="text-white font-medium">({entry.value})</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

