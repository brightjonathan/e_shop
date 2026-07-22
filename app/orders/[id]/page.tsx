"use client";

// app/orders/[id]/page.tsx
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetchOrder } from "@/lib/Actions/Order.action";
import { useAppContext } from "@/Context/AppContextProvider";
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

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
};

// ── Visual progress tracker ──────────────────────────────────
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
            {status === "Cancelled" ? "This order was cancelled and will not be fulfilled." : "This order was refunded."}
          </p>
        </div>
      </div>
    );
  }


  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-start overflow-x-auto pb-1 scrollbar-hide">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isDone = isCompleted || isCurrent;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2 shrink-0 w-[76px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  isDone
                    ? "bg-[#fce3c7] border-[#fce3c7] text-black"
                    : "bg-transparent border-white/15 text-white/30"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  isCurrent ? "text-white font-semibold" : isCompleted ? "text-white/60" : "text-white/30"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4 min-w-[16px] ${isCompleted ? "bg-[#fce3c7]" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authLoading } = useAppContext();
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Wait for Firebase Auth to finish restoring the session first —
    // fetching while authLoading is true would send an unauthenticated
    // request and get rejected by the security rules even for the
    // order's rightful owner.
    if (!id || authLoading) return;

    let cancelled = false;
    setLoading(true);
    fetchOrder(id).then((data) => {
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, authLoading]);

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
        <Link
          href="/orders"
          className="mt-2 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All Orders
        </Link>

        {order.paymentStatus === "Paid" && order.status === "Pending" && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-white text-sm font-semibold">Payment confirmed — order placed!</p>
              <p className="text-white/50 text-xs mt-0.5">We&apos;ll update you as it moves through fulfillment.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
              <button
                onClick={() => copyToClipboard(order.id ?? "", "Order ID")}
                className="text-white/30 hover:text-white transition-colors"
                aria-label="Copy order ID"
              >
                <CopyIcon />
              </button>
            </div>
            <p className="text-white/40 text-sm mt-1">{formatDate(order)}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
        </div>

        {/* Tracker */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mt-6 mb-6">
          <OrderTracker status={order.status} />
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: items + shipping */}
          <div className="lg:col-span-2 flex flex-col gap-6">
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
                  <p className="text-[#fce3c7] text-sm font-semibold shrink-0">
                    {formatNaira(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white/70 mb-2">Shipping To</h2>
              <p className="text-white text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-white/50 text-xs mt-1">{order.shippingAddress.phone}</p>
              <p className="text-white/50 text-xs">
                {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-white/40 text-xs mt-2 capitalize">Delivery: {order.deliveryMethod}</p>
              {order.trackingNumber && (
                <div className="flex items-center gap-1.5 mt-2">
                  <p className="text-white/40 text-xs">
                    Tracking: {order.trackingNumber} {order.courier ? `(${order.courier})` : ""}
                  </p>
                  <button
                    onClick={() => copyToClipboard(order.trackingNumber ?? "", "Tracking number")}
                    className="text-white/30 hover:text-white transition-colors"
                    aria-label="Copy tracking number"
                  >
                    <CopyIcon />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: total breakdown — sticky on desktop */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-2">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Order Summary</h2>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;




// "use client";

// // app/orders/[id]/page.tsx
// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import toast from "react-hot-toast";
// import { fetchOrder } from "@/lib/Actions/Order.action";
// import { useAppContext } from "@/Context/AppContextProvider";
// import { OrderType, OrderStatus } from "@/types/Order";

// const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// const formatDate = (order: OrderType) => {
//   const date = order.createdAt?.toDate?.();
//   if (!date) return "";
//   return date.toLocaleDateString("en-NG", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//   });
// };

// const STATUS_STYLES: Record<OrderStatus, string> = {
//   Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
//   Confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
//   Packing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
//   Shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
//   "Out for Delivery": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
//   Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
//   Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
// };

// const STEPS: OrderStatus[] = ["Pending", "Confirmed", "Packing", "Shipped", "Out for Delivery", "Delivered"];

// const CopyIcon = () => (
//   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <rect x="9" y="9" width="13" height="13" rx="2" />
//     <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
//   </svg>
// );

// const copyToClipboard = (text: string, label: string) => {
//   navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
// };

// // ── Visual progress tracker ──────────────────────────────────
// const OrderTracker: React.FC<{ status: OrderStatus }> = ({ status }) => {


//   if (status === "Cancelled") {
//     return (
//       <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
//         <span className="text-2xl">✕</span>
//         <div>
//           <p className="text-white text-sm font-semibold">Order Cancelled</p>
//           <p className="text-white/50 text-xs mt-0.5">This order was cancelled and will not be fulfilled.</p>
//         </div>
//       </div>
//     );
//   }

//   const currentIndex = STEPS.indexOf(status);


//   return (
//     <div className="flex items-start overflow-x-auto pb-1 scrollbar-hide">
//       {STEPS.map((step, i) => {
//         const isCompleted = i < currentIndex;
//         const isCurrent = i === currentIndex;
//         const isDone = isCompleted || isCurrent;
//         return (
//           <React.Fragment key={step}>
//             <div className="flex flex-col items-center gap-2 shrink-0 w-[76px]">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
//                   isDone
//                     ? "bg-[#fce3c7] border-[#fce3c7] text-black"
//                     : "bg-transparent border-white/15 text-white/30"
//                 }`}
//               >
//                 {isCompleted ? "✓" : i + 1}
//               </div>
//               <span
//                 className={`text-[10px] text-center leading-tight ${
//                   isCurrent ? "text-white font-semibold" : isCompleted ? "text-white/60" : "text-white/30"
//                 }`}
//               >
//                 {step}
//               </span>
//             </div>
//             {i < STEPS.length - 1 && (
//               <div className={`h-0.5 flex-1 mt-4 min-w-[16px] ${isCompleted ? "bg-[#fce3c7]" : "bg-white/10"}`} />
//             )}
//           </React.Fragment>
//         );
//       })}
//     </div>
//   );
// };

// const OrderDetailPage: React.FC = () => {



//   const { id } = useParams<{ id: string }>();
//   const { authLoading } = useAppContext();
//   const [order, setOrder] = useState<OrderType | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   useEffect(() => {
//     // Wait for Firebase Auth to finish restoring the session first —
//     // fetching while authLoading is true would send an unauthenticated
//     // request and get rejected by the security rules even for the
//     // order's rightful owner.
//     if (!id || authLoading) return;

//     let cancelled = false;
//     setLoading(true);
//     fetchOrder(id).then((data) => {
//       if (cancelled) return;
//       if (!data) {
//         setNotFound(true);
//       } else {
//         setOrder(data);
//       }
//       setLoading(false);
//     });
//     return () => {
//       cancelled = true;
//     };
//   }, [id, authLoading]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (notFound || !order) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3 px-4 text-center">
//         <span className="text-4xl">🔍</span>
//         <h2 className="text-white font-semibold text-lg">Order not found</h2>
//         <Link
//           href="/orders"
//           className="mt-2 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
//         >
//           View All Orders
//         </Link>
//       </div>
//     );
//   }


//   return (
//     <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-10">
//       <div className="max-w-5xl mx-auto">
//         {/* Back link */}
//         <Link href="/orders" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-5 transition-colors">
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 18l-6-6 6-6" />
//           </svg>
//           All Orders
//         </Link>

//         {order.paymentStatus === "Paid" && order.status === "Pending" && (
//           <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
//             <span className="text-2xl">✅</span>
//             <div>
//               <p className="text-white text-sm font-semibold">Payment confirmed — order placed!</p>
//               <p className="text-white/50 text-xs mt-0.5">We&apos;ll update you as it moves through fulfillment.</p>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
//           <div>
//             <div className="flex items-center gap-2">
//               <h1 className="text-xl font-bold text-white">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
//               <button
//                 onClick={() => copyToClipboard(order.id ?? "", "Order ID")}
//                 className="text-white/30 hover:text-white transition-colors"
//                 aria-label="Copy order ID"
//               >
//                 <CopyIcon />
//               </button>
//             </div>
//             <p className="text-white/40 text-sm mt-1">{formatDate(order)}</p>
//           </div>
//           <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
//             {order.status}
//           </span>
//         </div>

//         {/* Tracker */}
//         <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 mt-6 mb-6">
//           <OrderTracker status={order.status} />
//         </div>

//         {/* Two-column layout on desktop */}
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Left: items + shipping */}
//           <div className="lg:col-span-2 flex flex-col gap-6">
//             <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-4">
//               {order.items.map((item, i) => (
//                 <div key={item.id + i} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
//                   <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
//                     {item.imageURL ? (
//                       <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
//                     ) : (
//                       <span className="text-xl">🛍️</span>
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-white text-sm font-medium truncate">{item.productName}</p>
//                     <p className="text-white/40 text-xs mt-0.5">
//                       {formatNaira(item.price)} × {item.quantity}
//                     </p>
//                   </div>
//                   <p className="text-[#fce3c7] text-sm font-semibold shrink-0">
//                     {formatNaira(item.price * item.quantity)}
//                   </p>
//                 </div>
//               ))}
//             </div>

//             <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5">
//               <h2 className="text-sm font-semibold text-white/70 mb-2">Shipping To</h2>
//               <p className="text-white text-sm">{order.shippingAddress.fullName}</p>
//               <p className="text-white/50 text-xs mt-1">{order.shippingAddress.phone}</p>
//               <p className="text-white/50 text-xs">
//                 {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}
//               </p>
//               <p className="text-white/40 text-xs mt-2 capitalize">Delivery: {order.deliveryMethod}</p>
//               {order.trackingNumber && (
//                 <div className="flex items-center gap-1.5 mt-2">
//                   <p className="text-white/40 text-xs">
//                     Tracking: {order.trackingNumber} {order.courier ? `(${order.courier})` : ""}
//                   </p>
//                   <button
//                     onClick={() => copyToClipboard(order.trackingNumber ?? "", "Tracking number")}
//                     className="text-white/30 hover:text-white transition-colors"
//                     aria-label="Copy tracking number"
//                   >
//                     <CopyIcon />
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right: total breakdown — sticky on desktop */}
//           <div className="lg:sticky lg:top-6 lg:self-start">
//             <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-2">
//               <h2 className="text-sm font-semibold text-white/70 mb-3">Order Summary</h2>
//               <div className="flex justify-between text-sm">
//                 <span className="text-white/60">Subtotal</span>
//                 <span className="text-white">{formatNaira(order.subtotal)}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-white/60">Shipping</span>
//                 <span className="text-white">{order.shippingFee === 0 ? "Free" : formatNaira(order.shippingFee)}</span>
//               </div>
//               <div className="flex justify-between text-base font-bold border-t border-white/10 pt-3 mt-2">
//                 <span className="text-white">Total</span>
//                 <span className="text-[#fce3c7]">{formatNaira(order.total)}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderDetailPage;



