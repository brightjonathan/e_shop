"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "@/css/PublicProduct.module.scss";
import {
  fetchAllProducts,
  filterProducts,
  paginateProducts,
  getTotalPages,
} from "@/lib/Actions/publicProduct.action";
import { ProductType } from "@/types/Product"; 
import Image from "next/image";

// ── Constants ──────────────────────────────────────────────
const DEFAULT_PER_PAGE = 50;
const MIN_PER_PAGE = 10;
const MAX_PER_PAGE = 200;
const PER_PAGE_STEP = 10;

// ── Helpers ────────────────────────────────────────────────
const shortenText = (text: string, numberOfText: number): string => {
  if (text && text.length > numberOfText) {
    return text.substring(0, numberOfText).concat("...");
  }
  return text || "";
};

// ── Search Icon ────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── Cart Icon ──────────────────────────────────────────────
const CartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// ── Pagination ─────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className={styles.pagination}>
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">‹</button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className={styles.dots}>…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            className={currentPage === p ? styles.active : ""}
            aria-label={`Page ${p}`} aria-current={currentPage === p ? "page" : undefined}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">›</button>
    </div>
  );
};

// ── Product Card ───────────────────────────────────────────
interface CardProps {
  product: ProductType;
}

const ProductCard: React.FC<CardProps> = ({ product }) => {
  const { productName, imageURL, price, category, description } = product;


  const discountPrice = price + (price * 0.1);
  const amountSaved = discountPrice - price;
  const discountPercentage = Math.round((amountSaved / price) * 100);


  return (
    <article className={styles.card} aria-label={productName}>
      {/* Image */}
      <div className={styles.cardImg}>
        {imageURL ? (
          <Image src={imageURL} alt={productName} loading="lazy" width={300} height={300} />
        ) : (
          <div className={styles.imgPlaceholder}>🛍️</div>
        )}

        {/* Discount badge */}
    
          <span className={styles.discountBadge}>{discountPercentage}% off</span>
        

        {/* Category badge */}
        {category && (
          <span className={styles.categoryBadge}>{category}</span>
        )}
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        {/* {category && <span className={styles.cardCategory}>{category}</span>} */}

        <h3 className={styles.cardName} title={productName}>
          {shortenText(productName, 40)}
        </h3>

        {description && (
          <p className={styles.cardDesc}>{shortenText(description, 60)}</p>
        )}

        {/* Pricing row */}
        <div className={styles.priceRow}>
          <span className={styles.cardPrice}>&#8358;{price.toLocaleString("en-NG")}</span>
            <span className={styles.originalPrice}>&#8358; {discountPrice.toLocaleString("en-NG")}</span>
        </div>

        {/* Money saved */}
          <p className={styles.moneySaved}>&#8358; {amountSaved.toLocaleString("en-NG")}</p>

        {/* Add to Cart — UI only, no functionality yet */}
        <button className={styles.cartBtn} type="button" aria-label={`Add ${productName} to cart`}>
          <CartIcon />
          Add to Cart
        </button>
      </div>
    </article>
  );
};

// ── Main Page ──────────────────────────────────────────────
const Products: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    // setLoading(true);
    fetchAllProducts().then(({ products, error }) => {
      if (!cancelled) {
        setAllProducts(products);
        setError(error);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => filterProducts(allProducts, search), [allProducts, search]);
  const totalPages = useMemo(() => getTotalPages(filtered.length, perPage), [filtered.length, perPage]);
  const visible = useMemo(() => paginateProducts(filtered, currentPage, perPage), [filtered, currentPage, perPage]);

  useEffect(() => { setCurrentPage(1); }, [search, perPage]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), []);
  const decreasePerPage = () => setPerPage((p) => Math.max(MIN_PER_PAGE, p - PER_PAGE_STEP));
  const increasePerPage = () => setPerPage((p) => Math.min(MAX_PER_PAGE, p + PER_PAGE_STEP));

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <h1>Our Products</h1>
        <p>Discover our full collection — search by name or category</p>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input type="text" placeholder="Search by name or category…"
            value={search} onChange={handleSearch} aria-label="Search products" />
        </div>

        <div className={styles.perPageWrap}>
          <label>Per page</label>
          <div className={styles.perPageControl}>
            <button onClick={decreasePerPage} disabled={perPage <= MIN_PER_PAGE} aria-label="Fewer per page">−</button>
            <span>{perPage}</span>
            <button onClick={increasePerPage} disabled={perPage >= MAX_PER_PAGE} aria-label="More per page">+</button>
          </div>
        </div>

        {/* {!loading && (
          <p className={styles.resultCount}>
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "product" : "products"} found
          </p>
        )} */}
      </div>

      {/* Content */}
      <main className={styles.container}>
        {loading ? (
          <div className={styles.grid}>
            <div className={styles.stateBox}>
              <div className={styles.spinner} aria-label="Loading products" />
              <h3>Loading products…</h3>
            </div>
          </div>
        ) : error ? (
          <div className={styles.grid}>
            <div className={styles.stateBox}>
              <span className={styles.stateIcon}>⚠️</span>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.grid}>
            <div className={styles.stateBox}>
              <span className={styles.stateIcon}>🔍</span>
              <h3>No products found</h3>
              <p>{search ? `No results for "${search}" — try a different term.` : "No products available yet."}</p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </>
        )}
      </main>
    </div>
  );
};

export default Products;

