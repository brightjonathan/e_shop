"use client";

// app/orders/page.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/Context/AppContextProvider";
import { fetchUserOrders } from "@/lib/Actions/Order.action";
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

const OrdersPage: React.FC = () => {
  const { user, authLoading } = useAppContext();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | OrderStatus>("All");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  useEffect(() => {
    if (authLoading) return; // still checking — don't decide anything yet
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchUserOrders(user.uid).then((data) => {
      if (!cancelled) {
        setOrders(data.filter((o) => o.paymentStatus === "Paid"));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

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
          o.items.some((item) => item.productName.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.().getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.().getTime() ?? 0;
      return sortNewestFirst ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [orders, activeFilter, search, sortNewestFirst]);

  // Count per status, for badges on the filter tabs
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            {!loading && user && (
              <p className="text-white/40 text-sm mt-1">
                {orders.length} order{orders.length === 1 ? "" : "s"} placed
              </p>
            )}
          </div>

          {!loading && user && orders.length > 0 && (
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

        {!user ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-4xl">🔒</span>
            <h3 className="text-white font-semibold">Sign in to see your orders</h3>
            <Link
              href="/signin"
              className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-4xl">📦</span>
            <h3 className="text-white font-semibold">No orders yet</h3>
            <p className="text-white/40 text-sm">Your past orders will show up here.</p>
            <Link
              href="/"
              className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
            >
              Browse Products
            </Link>
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
                placeholder="Search by order ID or product name…"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
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

            {/* Results */}
            {visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-white/50 text-sm">No orders match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#131313] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          Order #{order.id?.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">{formatDate(order)}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Thumbnail row */}
                    <div className="flex items-center gap-2 mb-3">
                      {order.items.slice(0, 5).map((item, i) => (
                        <div key={item.id + i} className="relative w-11 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0">
                          {item.imageURL ? (
                            <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-xs">🛍️</span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <span className="text-white/40 text-xs">+{order.items.length - 5} more</span>
                      )}
                    </div>

                    {/* First item name preview — helps scanning without opening the order */}
                    <p className="text-white/50 text-xs truncate mb-3">
                      {order.items[0]?.productName}
                      {order.items.length > 1 ? ` and ${order.items.length - 1} more item${order.items.length > 2 ? "s" : ""}` : ""}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <p className="text-white/50 text-xs">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(order.total)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;


// "use client";

// // app/orders/page.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useAppContext } from "@/Context/AppContextProvider";
// import { fetchUserOrders } from "@/lib/Actions/Order.action";
// import { OrderType, OrderStatus } from "@/types/Order";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "@/lib/Firebase/client";
// import { useRouter } from "next/navigation";
// import Header from "@/components/Header";


// const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// const formatDate = (order: OrderType) => {
//   const date = order.createdAt?.toDate?.();
//   if (!date) return "";
//   return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
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

// const FILTER_TABS: ("All" | OrderStatus)[] = [
//   "All",
//   "Pending",
//   "Confirmed",
//   "Packing",
//   "Shipped",
//   "Out for Delivery",
//   "Delivered",
//   "Cancelled",
// ];

// const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
//   <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[status]}`}>
//     {status}
//   </span>
// );

// const SearchIcon = () => (
//   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="11" cy="11" r="8" />
//     <line x1="21" y1="21" x2="16.65" y2="16.65" />
//   </svg>
// );

// const OrdersPage: React.FC = () => {

//    const router = useRouter();
//   const { user, authLoading } = useAppContext();
//   const [orders, setOrders] = useState<OrderType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [activeFilter, setActiveFilter] = useState<"All" | OrderStatus>("All");
//   const [sortNewestFirst, setSortNewestFirst] = useState(true);

//   useEffect(() => {
//     if (authLoading) return; // still checking — don't decide anything yet
//     if (!user) {
//       setLoading(false);
//       return;
//     }
//     let cancelled = false;
//     setLoading(true);
//     fetchUserOrders(user.uid).then((data) => {
//       if (!cancelled) {
//         setOrders(data.filter((o) => o.paymentStatus === "Paid"));
//         setLoading(false);
//       }
//     });
//     return () => {
//       cancelled = true;
//     };
//   }, [user, authLoading]);

//   const visibleOrders = useMemo(() => {
//     let result = orders;

//     if (activeFilter !== "All") {
//       result = result.filter((o) => o.status === activeFilter);
//     }

//     if (search.trim()) {
//       const q = search.trim().toLowerCase();
//       result = result.filter(
//         (o) =>
//           o.id?.toLowerCase().includes(q) ||
//           o.items.some((item) => item.productName.toLowerCase().includes(q))
//       );
//     }

//     result = [...result].sort((a, b) => {
//       const aTime = a.createdAt?.toDate?.().getTime() ?? 0;
//       const bTime = b.createdAt?.toDate?.().getTime() ?? 0;
//       return sortNewestFirst ? bTime - aTime : aTime - bTime;
//     });

//     return result;
//   }, [orders, activeFilter, search, sortNewestFirst]);

//   // Count per status, for badges on the filter tabs
//   const countsByStatus = useMemo(() => {
//     const counts: Record<string, number> = { All: orders.length };
//     orders.forEach((o) => {
//       counts[o.status] = (counts[o.status] ?? 0) + 1;
//     });
//     return counts;
//   }, [orders]);


//    // Listen for authentication state changes
//     useEffect(() => {
//       const unsub = onAuthStateChanged(auth, async (user) => {
//         if (!user) {
//           router.push("/login");
//           return;
//         }
//         // setCurrentUser(user);
//         // await fetchProfile(user);
//         setLoading(false);
//       });
//       return () => unsub();
//     }, []);

//   return (
//     <>
//      <Header/>
//     <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-10">
//       <div className="max-w-5xl mx-auto">
//         <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
//           <div>
//             <h1 className="text-2xl font-bold text-white">My Orders</h1>
//             {!loading && user && (
//               <p className="text-white/40 text-sm mt-1">
//                 {orders.length} order{orders.length === 1 ? "" : "s"} placed
//               </p>
//             )}
//           </div>

//           {!loading && user && orders.length > 0 && (
//             <button
//               onClick={() => setSortNewestFirst((prev) => !prev)}
//               className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-colors flex items-center gap-1.5"
//             >
//               {sortNewestFirst ? "Newest first" : "Oldest first"}
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                 <path d={sortNewestFirst ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             </button>
//           )}
//         </div>

//         {!user ? (
//           <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
//             <span className="text-4xl">🔒</span>
//             <h3 className="text-white font-semibold">Sign in to see your orders</h3>
//             <Link
//               href="/signin"
//               className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
//             >
//               Sign In
//             </Link>
//           </div>
//         ) : loading ? (
//           <div className="flex flex-col items-center gap-3 py-24">
//             <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
//             <p className="text-white/40 text-sm">Loading your orders…</p>
//           </div>
//         ) : orders.length === 0 ? (
//           <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
//             <span className="text-4xl">📦</span>
//             <h3 className="text-white font-semibold">No orders yet</h3>
//             <p className="text-white/40 text-sm">Your past orders will show up here.</p>
//             <Link
//               href="/"
//               className="mt-3 bg-[#fce3c7] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
//             >
//               Browse Products
//             </Link>
//           </div>
//         ) : (
//           <>
//             {/* Search */}
//             <div className="relative mb-4">
//               <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
//                 <SearchIcon />
//               </span>
//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search by order ID or product name…"
//                 className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
//               />
//             </div>

//             {/* Status filter tabs */}
//             <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
//               {FILTER_TABS.map((tab) => {
//                 const count = countsByStatus[tab] ?? 0;
//                 if (tab !== "All" && count === 0) return null;
//                 const isActive = activeFilter === tab;
//                 return (
//                   <button
//                     key={tab}
//                     onClick={() => setActiveFilter(tab)}
//                     className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors whitespace-nowrap ${
//                       isActive
//                         ? "bg-[#fce3c7] text-black border-[#fce3c7]"
//                         : "bg-transparent text-white/60 border-white/10 hover:border-white/25 hover:text-white"
//                     }`}
//                   >
//                     {tab} <span className={isActive ? "text-black/50" : "text-white/30"}>{count}</span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Results */}
//             {visibleOrders.length === 0 ? (
//               <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
//                 <span className="text-3xl">🔍</span>
//                 <p className="text-white/50 text-sm">No orders match your search.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {visibleOrders.map((order) => (
//                   <Link
//                     key={order.id}
//                     href={`/orders/${order.id}`}
//                     className="block bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#131313] transition-colors"
//                   >
//                     <div className="flex items-center justify-between mb-3 gap-2">
//                       <div className="min-w-0">
//                         <p className="text-white text-sm font-semibold truncate">
//                           Order #{order.id?.slice(0, 8).toUpperCase()}
//                         </p>
//                         <p className="text-white/40 text-xs mt-0.5">{formatDate(order)}</p>
//                       </div>
//                       <StatusBadge status={order.status} />
//                     </div>

//                     {/* Thumbnail row */}
//                     <div className="flex items-center gap-2 mb-3">
//                       {order.items.slice(0, 5).map((item, i) => (
//                         <div key={item.id + i} className="relative w-11 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0">
//                           {item.imageURL ? (
//                             <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
//                           ) : (
//                             <span className="flex items-center justify-center h-full text-xs">🛍️</span>
//                           )}
//                         </div>
//                       ))}
//                       {order.items.length > 5 && (
//                         <span className="text-white/40 text-xs">+{order.items.length - 5} more</span>
//                       )}
//                     </div>

//                     {/* First item name preview — helps scanning without opening the order */}
//                     <p className="text-white/50 text-xs truncate mb-3">
//                       {order.items[0]?.productName}
//                       {order.items.length > 1 ? ` and ${order.items.length - 1} more item${order.items.length > 2 ? "s" : ""}` : ""}
//                     </p>

//                     <div className="flex items-center justify-between pt-3 border-t border-white/5">
//                       <p className="text-white/50 text-xs">
//                         {order.items.length} item{order.items.length === 1 ? "" : "s"}
//                       </p>
//                       <p className="text-[#fce3c7] text-sm font-semibold">{formatNaira(order.total)}</p>
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   </>
//   );
// };

// export default OrdersPage;

