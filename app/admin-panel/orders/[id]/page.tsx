"use client";

// app/admin-panel/orders/[id]/page.tsx
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAppContext } from "@/Context/AppContextProvider";
import {
  fetchOrder,
  updateOrderStatus,
  addTrackingInfo,
  cancelOrder,
  refundOrder,
} from "@/lib/Actions/Order.action";
import { OrderType, OrderStatus } from "@/types/Order";

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const formatDate = (order: OrderType) => {
  const date = order.createdAt?.toDate?.();
  if (!date) return "";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

const STEPS: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  Pending: { label: "Accept Order", next: "Confirmed" },
  Confirmed: { label: "Start Processing", next: "Processing" },
  Processing: { label: "Mark as Packed", next: "Packed" },
  Packed: { label: "Ship Order", next: "Shipped" },
  Shipped: { label: "Mark Out for Delivery", next: "Out for Delivery" },
  "Out for Delivery": { label: "Mark Delivered", next: "Delivered" },
};

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
};

// ── Tracker (same visual pattern as the customer-facing one) ────
const OrderTracker: React.FC<{ status: OrderStatus }> = ({ status }) => {
  if (status === "Cancelled" || status === "Refunded") {
    return (
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
        status === "Cancelled" ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
      }`}>
        <span className="text-2xl">{status === "Cancelled" ? "✕" : "↩"}</span>
        <div>
          <p className="text-white text-sm font-semibold">Order {status}</p>
          <p className="text-white/50 text-xs mt-0.5">
            {status === "Cancelled" ? "Stock was restored for all items in this order." : "This order was refunded to the customer."}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isDone = isCompleted || isCurrent;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2 shrink-0 w-[74px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  isDone ? "bg-[#fce3c7] border-[#fce3c7] text-black" : "bg-transparent border-white/15 text-white/30"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight ${
                isCurrent ? "text-white font-semibold" : isCompleted ? "text-white/60" : "text-white/30"
              }`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4 min-w-[14px] ${isCompleted ? "bg-[#fce3c7]" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppContext();

  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrder = () => {
    if (!id) return;
    setLoading(true);
    fetchOrder(id).then((data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setOrder(data);
        setCourier(data.courier ?? "");
        setTrackingNumber(data.trackingNumber ?? "");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdvanceStatus = async () => {
    if (!order?.id) return;
    const action = NEXT_ACTION[order.status];
    if (!action) return;

    setBusy(true);
    const res = await updateOrderStatus(order.id, action.next);
    setBusy(false);

    if (res.success) {
      toast.success(res.message);
      loadOrder();
    } else {
      toast.error(res.message);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setBusy(true);
    const res = await cancelOrder(order);
    setBusy(false);
    setConfirmingCancel(false);

    if (res.success) {
      toast.success(res.message);
      loadOrder();
    } else {
      toast.error(res.message);
    }
  };

  const handleRefund = async () => {
    if (!order?.id || !user) return;
    setBusy(true);
    const idToken = await user.getIdToken();
    const res = await refundOrder(order.id, refundReason, idToken);
    setBusy(false);
    setShowRefundForm(false);

    if (res.success) {
      toast.success(res.message);
      loadOrder();
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveTracking = async () => {
    if (!order?.id) return;
    if (!courier.trim() || !trackingNumber.trim()) {
      toast.error("Please fill in both courier and tracking number.");
      return;
    }
    setBusy(true);
    const res = await addTrackingInfo(order.id, courier.trim(), trackingNumber.trim());
    setBusy(false);
    setShowTrackingForm(false);

    if (res.success) {
      toast.success(res.message);
      loadOrder();
    } else {
      toast.error(res.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <span className="text-4xl">🔍</span>
        <h2 className="text-white font-semibold text-lg">Order not found</h2>
        <Link href="/admin-panel/orders" className="mt-2 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors">
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextAction = NEXT_ACTION[order.status];
  const canCancel = !["Delivered", "Cancelled", "Refunded"].includes(order.status);
  const canRefund = order.paymentStatus === "Paid" && order.status !== "Refunded";

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 py-8 md:py-10 text-white">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin-panel/orders" className="print:hidden inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All Orders
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
              <button onClick={() => copyToClipboard(order.id ?? "", "Order ID")} className="print:hidden text-white/30 hover:text-white transition-colors" aria-label="Copy order ID">
                <CopyIcon />
              </button>
            </div>
            <p className="text-white/40 text-sm mt-1">{formatDate(order)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>{order.status}</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/60">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="print:hidden flex flex-wrap items-center gap-2 mt-6 mb-6">
          {nextAction && (
            <button
              onClick={handleAdvanceStatus}
              disabled={busy}
              className="bg-[#fce3c7] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
            >
              {nextAction.label}
            </button>
          )}
          <button
            onClick={() => setShowTrackingForm((v) => !v)}
            className="text-sm font-medium px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white/70 hover:text-white transition-colors"
          >
            {order.trackingNumber ? "Edit Tracking" : "Add Tracking Number"}
          </button>
          {canCancel && (
            <button
              onClick={() => setConfirmingCancel((v) => !v)}
              className="text-sm font-medium px-4 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Cancel Order
            </button>
          )}
          {canRefund && (
            <button
              onClick={() => setShowRefundForm((v) => !v)}
              className="text-sm font-medium px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white/70 hover:text-white transition-colors"
            >
              Refund
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="text-sm font-medium px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white/70 hover:text-white transition-colors ml-auto"
          >
            Print Invoice
          </button>
        </div>

        {/* Cancel confirmation */}
        {confirmingCancel && (
          <div className="print:hidden bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-white text-sm">Cancel this order and restore stock for all its items?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmingCancel(false)} className="text-xs px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white transition-colors">
                Keep Order
              </button>
              <button onClick={handleCancel} disabled={busy} className="text-xs px-3 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                Yes, Cancel & Restore Stock
              </button>
            </div>
          </div>
        )}

        {/* Refund form */}
        {showRefundForm && (
          <div className="print:hidden bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-white text-sm font-medium mb-2">Refund {formatNaira(order.total)} to the customer</p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/30 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRefundForm(false)} className="text-xs px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleRefund} disabled={busy} className="text-xs px-3 py-2 rounded-lg bg-[#fce3c7] text-black font-medium hover:bg-white transition-colors disabled:opacity-50">
                {busy ? "Processing…" : "Confirm Refund via Paystack"}
              </button>
            </div>
          </div>
        )}

        {/* Tracking form */}
        {showTrackingForm && (
          <div className="print:hidden bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-white text-sm font-medium mb-3">Tracking Info</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="Courier (e.g. DHL)"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              />
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking Number"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTrackingForm(false)} className="text-xs px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveTracking} disabled={busy} className="text-xs px-3 py-2 rounded-lg bg-[#fce3c7] text-black font-medium hover:bg-white transition-colors disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        )}

        {/* Tracker */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mb-6">
          <OrderTracker status={order.status} />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Items */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-4">
              {order.items.map((item, i) => (
                <div key={item.id + i} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
                  <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                    {item.imageURL ? (
                      <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
                    ) : (
                      <span className="text-xl">🛍️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {formatNaira(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-[#fce3c7] text-sm font-semibold shrink-0">{formatNaira(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Customer + Shipping */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Customer & Shipping</h2>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-white/40 text-xs">Customer</p>
                  <p className="text-white mt-0.5">{order.shippingAddress.fullName}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Email</p>
                  <p className="text-white mt-0.5">{order.userEmail}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Phone</p>
                  <p className="text-white mt-0.5">{order.shippingAddress.phone}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Delivery Method</p>
                  <p className="text-white mt-0.5 capitalize">{order.deliveryMethod}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-white/40 text-xs">Shipping Address</p>
                  <p className="text-white mt-0.5">
                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                </div>
                {order.trackingNumber && (
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <div>
                      <p className="text-white/40 text-xs">Tracking Number</p>
                      <p className="text-white mt-0.5">
                        {order.trackingNumber} {order.courier ? `(${order.courier})` : ""}
                      </p>
                    </div>
                    <button onClick={() => copyToClipboard(order.trackingNumber ?? "", "Tracking number")} className="print:hidden text-white/30 hover:text-white transition-colors mt-3" aria-label="Copy tracking number">
                      <CopyIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-2">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Order Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Payment Method</span>
                <span className="text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Shipping</span>
                <span className="text-white">{order.shippingFee === 0 ? "Free" : formatNaira(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-3 mt-2">
                <span className="text-white">Total</span>
                <span className="text-[#fce3c7]">{formatNaira(order.total)}</span>
              </div>
              {order.refundReference && (
                <p className="text-white/40 text-xs pt-2 border-t border-white/10 mt-2">
                  Refunded {order.refundReason ? `— ${order.refundReason}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;