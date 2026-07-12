"use client";

import styles from "./Productform.module.scss";
import { categories } from "./Categories";
import { ProductType } from "@/types/Product";
import Image from "next/image";

const MIN_IMAGES = 4;
const MAX_IMAGES = 8;

interface Props {
  product: ProductType;
  setProduct: React.Dispatch<React.SetStateAction<ProductType>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  progress: number;
  handleImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonText: string;
  title: string;
}

export default function Productform({
  product,
  setProduct,
  onSubmit,
  loading,
  progress,
  handleImages,
  buttonText,
  title,
}: Props) {
  const imageCount = product.imageURLs?.length ?? 0;
  const hasMinImages = imageCount >= MIN_IMAGES;
  const atMaxImages = imageCount >= MAX_IMAGES;
  const isUploading = progress > 0 && progress < 100;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setProduct({ ...product, price: raw === "" ? 0 : Number(raw) });
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setProduct({ ...product, stock: raw === "" ? 0 : Number(raw) });
  };

  const removeImage = (index: number) => {
    setProduct({
      ...product,
      imageURLs: product.imageURLs.filter((_, i) => i !== index),
    });
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...product.imageURLs];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);
    setProduct({ ...product, imageURLs: reordered });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.headerAccent} />
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>Fill in the details below</p>
          </div>

          <form onSubmit={onSubmit} className={styles.form}>
            {/* Product Name */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>📦</span>
                Product Name
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Nike Air Max 270"
                value={product.productName}
                onChange={(e) =>
                  setProduct({ ...product, productName: e.target.value })
                }
                required
              />
            </div>

            {/* Image Gallery Upload */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>🖼️</span>
                Product Images
                <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>
                  ({imageCount}/{MIN_IMAGES} minimum, {MAX_IMAGES} max)
                </span>
              </label>

              <label className={styles.fileLabel}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={atMaxImages || isUploading}
                  onChange={handleImages}
                  className={styles.fileInputHidden}
                />
                <span className={styles.fileBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {atMaxImages ? "Max images reached" : "Add Images"}
                </span>
                <span className={styles.filePlaceholder}>
                  Select multiple files at once, or add more in batches
                </span>
              </label>

              {/* Gallery preview grid */}
              {imageCount > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {product.imageURLs.map((url, index) => (
                    <div
                      key={url + index}
                      style={{
                        position: "relative",
                        borderRadius: 10,
                        overflow: "hidden",
                        aspectRatio: "1 / 1",
                        border: index === 0 ? "2px solid #fce3c7" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Image
                        src={url}
                        alt={`Product image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />

                      {index === 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: "#fce3c7",
                            color: "#000",
                            padding: "2px 6px",
                            borderRadius: 999,
                          }}
                        >
                          Cover
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>

                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(index)}
                          style={{
                            position: "absolute",
                            bottom: 4,
                            left: 4,
                            right: 4,
                            fontSize: 9,
                            padding: "3px 4px",
                            borderRadius: 6,
                            background: "rgba(0,0,0,0.7)",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Make cover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!hasMinImages && imageCount > 0 && (
                <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 8 }}>
                  Add {MIN_IMAGES - imageCount} more image{MIN_IMAGES - imageCount === 1 ? "" : "s"} to continue.
                </p>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressHeader}>
                    <span>Uploading...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {progress === 100 && (
                <p className={styles.uploadDone}>✅ Upload complete</p>
              )}
            </div>

            {/* Three-column row: Price + Stock + Category */}
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>💰</span>
                  Price (₦)
                </label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>₦</span>
                  <input
                    className={`${styles.input} ${styles.inputWithPrefix}`}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={product.price ? product.price.toString() : ""}
                    onChange={handlePriceChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>📊</span>
                  Stock
                </label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={product.stock ? product.stock.toString() : ""}
                  onChange={handleStockChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>🏷️</span>
                  Category
                </label>
                <select
                  className={styles.input}
                  value={product.category}
                  onChange={(e) =>
                    setProduct({ ...product, category: e.target.value })
                  }
                >
                  <option value="">Choose Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>🏢</span>
                Brand
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Nike, Samsung, Apple"
                value={product.brand}
                onChange={(e) =>
                  setProduct({ ...product, brand: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>📝</span>
                Description
              </label>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Describe the product features, specs, and highlights..."
                value={product.description}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
              />
            </div>

            {/* Submit */}
            <button
              className={styles.button}
              type="submit"
              disabled={loading || isUploading || !hasMinImages}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {buttonText}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}





