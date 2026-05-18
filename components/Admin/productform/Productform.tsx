"use client";

import styles from "./Productform.module.scss";
import { categories } from "./Categories";
import { ProductType } from "@/types/Product";
import { useState } from "react";
import Image from "next/image";

interface Props {
  product: ProductType;
  setProduct: React.Dispatch<React.SetStateAction<ProductType>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  progress: number;
  handleImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonText: string;
  title: string;
}

export default function Productform({
  product,
  setProduct,
  onSubmit,
  loading,
  progress,
  handleImage,
  buttonText,
  title,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
//   const [priceValue, setPriceValue] = useState<string>(
//     product.price !== 0 ? String(product.price) : ""
//   );

  const handleImageWithPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImgLoaded(false);
      setPreview(URL.createObjectURL(file));
    }
    handleImage(e);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // setPriceValue(raw);
    setProduct({ ...product, price: raw === "" ? 0 : Number(raw) });
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

            {/* Image Upload */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>🖼️</span>
                Product Image
              </label>

              <label className={styles.fileLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageWithPreview}
                  className={styles.fileInputHidden}
                />
                <span className={styles.fileBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Choose Image
                </span>
                <span className={styles.filePlaceholder}>
                  {preview ? "Image selected ✓" : "No file chosen"}
                </span>
              </label>

              {/* Animated Image Preview */}
              {preview && (
                <div className={styles.previewContainer}>
                  {!imgLoaded && (
                    <div className={styles.imgSkeleton}>
                      <div className={styles.shimmer} />
                    </div>
                  )}
                  <Image
                    src={preview}
                    alt="Preview"
                    className={`${styles.previewImg} ${imgLoaded ? styles.previewImgVisible : ""}`}
                    onLoad={() => setImgLoaded(true)}
                    width={200}
                    height={200}
                  />
                </div>
              )}

              {/* Progress Bar */}
              {progress > 0 && progress < 100 && (
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

            {/* Two-column row: Price + Category */}
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
                    value={product.price !== 0 ? product.price.toString() : ""}
                    onChange={handlePriceChange}
                    required
                  />
                </div>
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
              disabled={loading}
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

