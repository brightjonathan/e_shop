"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "@/css/PublicProduct.module.scss";
import {
  fetchAllProducts,
  filterProducts,
  paginateProducts,
  getTotalPages,
  getCategories,
} from "@/lib/Actions/publicProduct.action";
import { ProductType } from "@/types/Product";
import { useAppContext } from "@/Context/AppContextProvider";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

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

/** SKU when present, falling back to the Firestore doc id — keeps links
 *  stable even for older products created before SKU existed. */
const getProductSlug = (product: ProductType): string =>
  product.sku && product.sku.trim() !== "" ? product.sku : (product.id ?? "");

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

// ── Check Icon (shown briefly after adding) ─────────────────
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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
  const { productName, imageURL, price, category, description, stock, discountPercentage, isNew, isFeatured } = product;
  const { addToCart } = useAppContext();

  // Real discount — only shown when the admin actually set one, instead
  // of the old flat +10% placeholder math.
  const hasDiscount = (discountPercentage ?? 0) > 0;
  const discountPrice = hasDiscount ? price - (price * discountPercentage!) / 100 : price;
  const amountSaved = price - discountPrice;

  const isOutOfStock = (stock ?? 0) <= 0;

  // "just added" feedback state — resets itself after a moment
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    toast.success(`${productName} added to cart`, { duration: 1500 });
  }, [product, addToCart, productName, isOutOfStock]);

  // Reset the "Added" feedback after a moment
  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  return (
    <article className={styles.card} aria-label={productName}>
      {/* Image */}
      <div className={styles.cardImg}>
        <Link href={`/product-details/${getProductSlug(product)}`} aria-label={`View details for ${productName}`}>
          {imageURL ? (
            <Image src={imageURL} alt={productName} loading="lazy" width={300} height={300} />
          ) : (
            <div className={styles.imgPlaceholder}>🛍️</div>
          )}
        </Link>

        {/* Discount badge — only when there's a real discount */}
        {hasDiscount && (
          <span className={styles.discountBadge}>{discountPercentage}% off</span>
        )}

        {/* Category badge */}
        {category && (
          <span className={styles.categoryBadge}>{category}</span>
        )}

        {/* New / Featured — bottom-left, kept clear of the existing
            top-corner badges above */}
        {(isNew || isFeatured) && (
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {isNew && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#fff",
                  color: "#000",
                }}
              >
                New
              </span>
            )}
            {isFeatured && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#fce3c7",
                  color: "#000",
                }}
              >
                ★ Featured
              </span>
            )}
          </div>
        )}

        {isOutOfStock && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardName} title={productName}>
          {shortenText(productName, 40)}
        </h3>

        {description && (
          <p className={styles.cardDesc}>{shortenText(description, 60)}</p>
        )}

        {/* Pricing row */}
        <div className={styles.priceRow}>
          <span className={styles.cardPrice}>&#8358;{discountPrice.toLocaleString("en-NG")}</span>
          {hasDiscount && (
            <span className={styles.originalPrice}>&#8358; {price.toLocaleString("en-NG")}</span>
          )}
        </div>

        {/* Money saved — only when there's an actual discount */}
        {hasDiscount && (
          <p className={styles.moneySaved}>&#8358; {amountSaved.toLocaleString("en-NG")}</p>
        )}

        {/* Add to Cart */}
        <button
          className={styles.cartBtn}
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={`Add ${productName} to cart`}
        >
          {isOutOfStock ? null : justAdded ? <CheckIcon /> : <CartIcon />}
          {isOutOfStock ? "Out of Stock" : justAdded ? "Added" : "Add to Cart"}
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    fetchAllProducts().then(({ products, error }) => {
      if (!cancelled) {
        setAllProducts(products);
        setError(error);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Hide anything the admin marked inactive — this IS the storefront.
  const activeProducts = useMemo(
    () => allProducts.filter((p) => p.isActive !== false),
    [allProducts]
  );

  //
  const categories = useMemo(() => ["All", ...getCategories(activeProducts)], [activeProducts]);

  const filtered = useMemo(() => {
    const byCategory =
      activeCategory === "All" ? activeProducts : activeProducts.filter((p) => p.category === activeCategory);
    return filterProducts(byCategory, search);
  }, [activeProducts, activeCategory, search]);

  const totalPages = useMemo(() => getTotalPages(filtered.length, perPage), [filtered.length, perPage]);
  const visible = useMemo(() => paginateProducts(filtered, currentPage, perPage), [filtered, currentPage, perPage]);

  useEffect(() => { setCurrentPage(1); }, [search, perPage, activeCategory]);

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
      </div>

      {/* Category filter */}
      {/* {categories.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginTop: 4,
            marginBottom: 24,
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === "All" ? activeProducts.length : activeProducts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                  background: isActive ? "#fce3c7" : "transparent",
                  color: isActive ? "#000" : "rgba(255,255,255,0.6)",
                  border: isActive ? "1px solid #fce3c7" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {cat} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )} */}

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








// "use client";

// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import styles from "@/css/PublicProduct.module.scss";
// import {
//   fetchAllProducts,
//   filterProducts,
//   paginateProducts,
//   getTotalPages,
// } from "@/lib/Actions/publicProduct.action";
// import { ProductType } from "@/types/Product";
// import { useAppContext } from "@/Context/AppContextProvider";
// import Image from "next/image";
// import Link from "next/link";
// import toast from "react-hot-toast";

// // ── Constants ──────────────────────────────────────────────
// const DEFAULT_PER_PAGE = 50;
// const MIN_PER_PAGE = 10;
// const MAX_PER_PAGE = 200;
// const PER_PAGE_STEP = 10;

// // ── Helpers ────────────────────────────────────────────────
// const shortenText = (text: string, numberOfText: number): string => {
//   if (text && text.length > numberOfText) {
//     return text.substring(0, numberOfText).concat("...");
//   }
//   return text || "";
// };

// // ── Search Icon ────────────────────────────────────────────
// const SearchIcon = () => (
//   <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="11" cy="11" r="8" />
//     <line x1="21" y1="21" x2="16.65" y2="16.65" />
//   </svg>
// );

// // ── Cart Icon ──────────────────────────────────────────────
// const CartIcon = () => (
//   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
//     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
//     <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
//   </svg>
// );

// // ── Check Icon (shown briefly after adding) ─────────────────
// const CheckIcon = () => (
//   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
//     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="20 6 9 17 4 12" />
//   </svg>
// );

// // ── Pagination ─────────────────────────────────────────────
// interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onChange: (page: number) => void;
// }

// const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onChange }) => {
//   if (totalPages <= 1) return null;

//   const pages: (number | "...")[] = [];
//   if (totalPages <= 7) {
//     for (let i = 1; i <= totalPages; i++) pages.push(i);
//   } else {
//     pages.push(1);
//     if (currentPage > 3) pages.push("...");
//     const start = Math.max(2, currentPage - 1);
//     const end = Math.min(totalPages - 1, currentPage + 1);
//     for (let i = start; i <= end; i++) pages.push(i);
//     if (currentPage < totalPages - 2) pages.push("...");
//     pages.push(totalPages);
//   }

//   return (
//     <div className={styles.pagination}>
//       <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">‹</button>
//       {pages.map((p, i) =>
//         p === "..." ? (
//           <span key={`dots-${i}`} className={styles.dots}>…</span>
//         ) : (
//           <button key={p} onClick={() => onChange(p as number)}
//             className={currentPage === p ? styles.active : ""}
//             aria-label={`Page ${p}`} aria-current={currentPage === p ? "page" : undefined}>
//             {p}
//           </button>
//         )
//       )}
//       <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">›</button>
//     </div>
//   );
// };

// // ── Product Card ───────────────────────────────────────────
// interface CardProps {
//   product: ProductType;
// }

// const ProductCard: React.FC<CardProps> = ({ product }) => {
//   const { productName, imageURL, price, category, description } = product;
//   const { addToCart } = useAppContext();

//   const discountPrice = price + price * 0.1;
//   const amountSaved = discountPrice - price;
//   const discountPercentage = Math.round((amountSaved / price) * 100);

//   // "just added" feedback state — resets itself after a moment
//   const [justAdded, setJustAdded] = useState(false);

//   const handleAddToCart = useCallback(() => {
//     addToCart(product, 1);
//     setJustAdded(true);
//     toast.success(`${productName} added to cart`, { duration: 1500 });
//   }, [product, addToCart, productName]);

//   // Reset the "Added" feedback after a moment
//   useEffect(() => {
//     if (!justAdded) return;
//     const timeout = setTimeout(() => setJustAdded(false), 1500);
//     return () => clearTimeout(timeout);
//   }, [justAdded]);

  

//   return (
//     <article className={styles.card} aria-label={productName}>
//       {/* Image */}
//       <div className={styles.cardImg}>
//         <Link href={`/product-details/${product.id}`} aria-label={`View details for ${productName}`}>
//           {imageURL ? (
//             <Image src={imageURL} alt={productName} loading="lazy" width={300} height={300} />
//           ) : (
//             <div className={styles.imgPlaceholder}>🛍️</div>
//           )}
//         </Link>

//         {/* Discount badge */}
//         <span className={styles.discountBadge}>{discountPercentage}% off</span>

//         {/* Category badge */}
//         {category && (
//           <span className={styles.categoryBadge}>{category}</span>
//         )}
//       </div>

//       {/* Body */}
//       <div className={styles.cardBody}>
//         <h3 className={styles.cardName} title={productName}>
//           {shortenText(productName, 40)}
//         </h3>

//         {description && (
//           <p className={styles.cardDesc}>{shortenText(description, 60)}</p>
//         )}

//         {/* Pricing row */}
//         <div className={styles.priceRow}>
//           <span className={styles.cardPrice}>&#8358;{price.toLocaleString("en-NG")}</span>
//           <span className={styles.originalPrice}>&#8358; {discountPrice.toLocaleString("en-NG")}</span>
//         </div>

//         {/* Money saved */}
//         <p className={styles.moneySaved}>&#8358; {amountSaved.toLocaleString("en-NG")}</p>

//         {/* Add to Cart */}
//         <button
//           className={styles.cartBtn}
//           type="button"
//           onClick={handleAddToCart}
//           aria-label={`Add ${productName} to cart`}
//         >
//           {justAdded ? <CheckIcon /> : <CartIcon />}
//           {justAdded ? "Added" : "Add to Cart"}
//         </button>
//       </div>
//     </article>
//   );
// };

// // ── Main Page ──────────────────────────────────────────────
// const Products: React.FC = () => {
//   const [allProducts, setAllProducts] = useState<ProductType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

//   useEffect(() => {
//     let cancelled = false;
//     fetchAllProducts().then(({ products, error }) => {
//       if (!cancelled) {
//         setAllProducts(products);
//         setError(error);
//         setLoading(false);
//       }
//     });
//     return () => { cancelled = true; };
//   }, []);

//   const filtered = useMemo(() => filterProducts(allProducts, search), [allProducts, search]);
//   const totalPages = useMemo(() => getTotalPages(filtered.length, perPage), [filtered.length, perPage]);
//   const visible = useMemo(() => paginateProducts(filtered, currentPage, perPage), [filtered, currentPage, perPage]);

//   useEffect(() => { setCurrentPage(1); }, [search, perPage]);

//   const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), []);
//   const decreasePerPage = () => setPerPage((p) => Math.max(MIN_PER_PAGE, p - PER_PAGE_STEP));
//   const increasePerPage = () => setPerPage((p) => Math.min(MAX_PER_PAGE, p + PER_PAGE_STEP));

//   return (
//     <div className={styles.page}>
//       {/* Hero */}
//       <header className={styles.hero}>
//         <h1>Our Products</h1>
//         <p>Discover our full collection — search by name or category</p>
//       </header>

//       {/* Controls */}
//       <div className={styles.controls}>
//         <div className={styles.searchWrap}>
//           <span className={styles.searchIcon}><SearchIcon /></span>
//           <input type="text" placeholder="Search by name or category…"
//             value={search} onChange={handleSearch} aria-label="Search products" />
//         </div>

//         <div className={styles.perPageWrap}>
//           <label>Per page</label>
//           <div className={styles.perPageControl}>
//             <button onClick={decreasePerPage} disabled={perPage <= MIN_PER_PAGE} aria-label="Fewer per page">−</button>
//             <span>{perPage}</span>
//             <button onClick={increasePerPage} disabled={perPage >= MAX_PER_PAGE} aria-label="More per page">+</button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <main className={styles.container}>
//         {loading ? (
//           <div className={styles.grid}>
//             <div className={styles.stateBox}>
//               <div className={styles.spinner} aria-label="Loading products" />
//               <h3>Loading products…</h3>
//             </div>
//           </div>
//         ) : error ? (
//           <div className={styles.grid}>
//             <div className={styles.stateBox}>
//               <span className={styles.stateIcon}>⚠️</span>
//               <h3>Something went wrong</h3>
//               <p>{error}</p>
//             </div>
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className={styles.grid}>
//             <div className={styles.stateBox}>
//               <span className={styles.stateIcon}>🔍</span>
//               <h3>No products found</h3>
//               <p>{search ? `No results for "${search}" — try a different term.` : "No products available yet."}</p>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className={styles.grid}>
//               {visible.map((product) => (
//                 <ProductCard key={product.id} product={product} />
//               ))}
//             </div>
//             <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
//           </>
//         )}
//       </main>
//     </div>
//   );
// };

// export default Products;










