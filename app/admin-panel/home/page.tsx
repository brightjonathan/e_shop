"use client";

// app/admin-panel/page.tsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchDashboardStats, DashboardStats } from "@/lib/Actions/admin.action";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const StatCard: React.FC<{ label: string; value: string; accent?: string; icon: string }> = ({
  label,
  value,
  accent = "text-white",
  icon,
}) => (
  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-white/40 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 md:px-12 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Earnings" value={formatNaira(stats.totalEarnings)} accent="text-[#fce3c7]" icon="💰" />
        <StatCard label="Total Products" value={String(stats.totalProducts)} icon="📦" />
        <StatCard label="Total Orders" value={String(stats.totalOrders)} icon="🧾" />
        <StatCard label="In Stock" value={String(stats.inStockCount)} accent="text-emerald-400" icon="✅" />
        <StatCard label="Low Stock (< 5)" value={String(stats.lowStockCount)} accent="text-amber-400" icon="⚠️" />
        <StatCard label="Out of Stock" value={String(stats.outOfStockCount)} accent="text-red-400" icon="🚫" />
      </div>

      {/* Earnings chart */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white/70 mb-4">Earnings — Last 14 Days</h2>
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
    </div>
  );
}





