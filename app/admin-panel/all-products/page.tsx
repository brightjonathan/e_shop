"use client";

/**
 * AllProducts.tsx  — Next.js App Router page
 * No Redux. Firebase real-time listener via product.action.ts.
 * Products ordered newest-first (orderBy createdAt desc).
 * Search: name + category, case-insensitive, with highlight.
 * Pagination: 5-button sliding window, configurable per-page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from '@/css/AllProduct.module.scss'
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiPackage,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { deleteProduct, subscribeToProducts } from "@/lib/Actions/AllProduct.action";
import { ProductType } from "@/types/Product";

// ─── Config ───────────────────────────────────────────────────────────────────

const PER_PAGE = 10;         // rows per page
const MAX_BTNS = 5;          // max visible page buttons (sliding window)
const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 h → show "New" badge
const LOW_STOCK_THRESHOLD = 5; // same threshold used across the rest of the app

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNew(product: ProductType): boolean {
  if (!product.createdAt) return false;
  const ms =
    product.createdAt instanceof Date
      ? product.createdAt.getTime()
      : product.createdAt.toMillis?.() ?? 0;
  return Date.now() - ms < NEW_THRESHOLD_MS;
}

// Same color convention used on the dashboard, the storefront, and the
// stock-tier admin pages: emerald = in stock, amber = low, red = out —
// so admins recognize status instantly regardless of which page they're on.
type StockTier = "in" | "low" | "out";

function getStockTier(stock: number | undefined): StockTier {
  const s = stock ?? 0;
  if (s <= 0) return "out";
  if (s < LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

const STOCK_TIER_STYLE: Record<StockTier, { bg: string; border: string; color: string; label: (n: number) => string }> = {
  in: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    color: "#34d399",
    label: (n) => `${n} in stock`,
  },
  low: {
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    color: "#fbbf24",
    label: (n) => `${n} left`,
  },
  out: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    color: "#f87171",
    label: () => "Out of stock",
  },
};

function StockBadge({ stock }: { stock: number | undefined }) {
  const tier = getStockTier(stock);
  const s = STOCK_TIER_STYLE[tier];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label(stock ?? 0)}
    </span>
  );
}

function DiscountBadge({ discountPercentage }: { discountPercentage: number | undefined }) {
  if (!discountPercentage || discountPercentage <= 0) {
    return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>—</span>;
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(252,227,199,0.15)",
        color: "#fce3c7",
        border: "1px solid rgba(252,227,199,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      {discountPercentage}% off
    </span>
  );
}

// ─── Highlight component ──────────────────────────────────────────────────────

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className={styles.highlight}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}



// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={styles.skeletonLine} style={{ width: 20 }} /></td>
          <td><div className={styles.skeletonImg} /></td>
          <td><div className={styles.skeletonLine} style={{ width: "80%" }} /></td>
          <td><div className={styles.skeletonLine} style={{ width: 70 }} /></td>
          <td><div className={styles.skeletonLine} style={{ width: 60 }} /></td>
          <td><div className={styles.skeletonLine} style={{ width: 50 }} /></td>
          <td><div className={styles.skeletonLine} style={{ width: 50 }} /></td>
          <td><div className={styles.skeletonLine} style={{ width: 60 }} /></td>
        </tr>
      ))}
    </>
  );
}



// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const half = Math.floor(MAX_BTNS / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + MAX_BTNS - 1;
  if (end > totalPages) { end = totalPages; start = Math.max(1, end - MAX_BTNS + 1); }

  const pages: (number | "…")[] = [];
  if (start > 1) { pages.push(1); if (start > 2) pages.push("…"); }
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages) { if (end < totalPages - 1) pages.push("…"); pages.push(totalPages); }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <FiChevronLeft size={13} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className={`${styles.pageBtn} ${styles.ellipsis}`}>…</span>
        ) : (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === currentPage ? styles.active : ""}`}
            onClick={() => onPageChange(p as number)}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <FiChevronRight size={13} />
      </button>
    </nav>
  );
}



// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface ModalProps {
  product: ProductType;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}



function DeleteModal({ product, onConfirm, onCancel, busy }: ModalProps) {
  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm delete"
      onClick={onCancel}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIconWrap}>
          <FiTrash2 size={22} />
        </div>
        <h3>Delete Product?</h3>
        <p>This cannot be undone. The product and its image will be permanently removed.</p>
        <span className={styles.modalProductName}>{product.productName}</span>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}



// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllProductsPage() {


  const [products, setProducts]   = useState<ProductType[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toDelete, setToDelete]   = useState<ProductType | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // ── Real-time Firebase subscription (latest first via orderBy createdAt desc) ──
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (data) => { setProducts(data); setLoading(false);
       },
      (msg)  => { setError(msg);    setLoading(false); }
    );
    return unsubscribe; // cleanup on unmount
  }, []);

  // ── Filter (case-insensitive, name + category) ────────────────────────────
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [products, search]);

  // ── Stock summary counts, for the legend ───────────────────────────────────
  const stockCounts = useMemo(() => {
    const counts = { in: 0, low: 0, out: 0 };
    products.forEach((p) => {
      counts[getStockTier(p.stock)] += 1;
    });
    return counts;
  }, [products]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * PER_PAGE;
  const pageItems  = filtered.slice(startIdx, startIdx + PER_PAGE);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    setDeleteBusy(true);
    try {
      await deleteProduct(toDelete.id!, toDelete.imageURL);
      toast.success("Product deleted successfully.");
      setToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed.";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  }, [toDelete]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root} ref={topRef}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Inventory</p>
          <h1 className={styles.title}>All Products</h1>
          {!loading && (
            <span className={styles.countPill}>
              <FiPackage size={12} />
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </span>
          )}
        </div>

        <div className={styles.searchBar}>
          <FiSearch size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search Product Name or Category…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            autoComplete="off"
            aria-label="Search products"
          />
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => handleSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Stock status legend, for quick visual reference ── */}
      {!loading && products.length > 0 && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          {(["in", "low", "out"] as StockTier[]).map((tier) => {
            const s = STOCK_TIER_STYLE[tier];
            const tierLabel = tier === "in" ? "In Stock" : tier === "low" ? "Low Stock" : "Out of Stock";
            return (
              <div key={tier} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ color: "black" }}>
                  {tierLabel} <span style={{ color: s.color, fontWeight: 600 }}>({stockCounts[tier]})</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <FiAlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Table card ── */}
      <div className={styles.card}>
        <table className={styles.table} aria-label="Products table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 90 }}>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th style={{ width: 120 }}>Stock</th>
              <th style={{ width: 100 }}>Discount</th>
              <th>Price</th>
              <th style={{ width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                      <FiPackage size={24} />
                    </div>
                    <h3>Nothing here</h3>
                    <p>
                      {search
                        ? `No products match "${search}"`
                        : "No products have been added yet."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((product, i) => (
                <tr key={product.id}>
                  {/* S/N */}
                  <td className={styles.sn}>{startIdx + i + 1}</td>

                  {/* Image */}
                  <td>
                    {product.imageURL ? (
                      <div className={styles.imgWrap}>
                        <Image
                          src={product.imageURL}
                          alt={product.productName}
                          fill
                          sizes="72px"
                          className={styles.productImg}
                        />
                      </div>
                    ) : (
                      <div className={styles.imgPlaceholder}>
                        <FiPackage size={22} />
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className={styles.nameCell}>
                    <Highlight text={product.productName} term={search} />
                    {isNew(product) && (
                      <span className={styles.newBadge}>New</span>
                    )}
                  </td>

                  {/* Category */}
                  <td>
                    <span className={styles.catBadge}>
                      <Highlight text={product.category} term={search} />
                    </span>
                  </td>

                  {/* Stock — color-coded */}
                  <td>
                    <StockBadge stock={product.stock} />
                  </td>

                  {/* Discount */}
                  <td>
                    <DiscountBadge discountPercentage={product.discountPercentage} />
                  </td>

                  {/* Price */}
                  <td className={styles.price}>
                    &#8358;{product.price.toLocaleString("en-NG", {minimumFractionDigits: 2})}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin-panel/edit-product/${product.id}`}
                        className={styles.editBtn}
                        aria-label={`Edit ${product.productName}`}
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </Link>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setToDelete(product)}
                        aria-label={`Delete ${product.productName}`}
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Footer + Pagination ── */}
        {!loading && filtered.length > 0 && (
          <div className={styles.footer}>
            <span className={styles.pageInfo}>
              Showing {startIdx + 1}–{Math.min(startIdx + PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {toDelete && (
        <DeleteModal
          product={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          busy={deleteBusy}
        />
      )}
    </div>
  );
}







