"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Productform from "@/components/Admin/productform/Productform";

import { addProduct } from "@/lib/Actions/Product.action";

import { uploadMultipleImages } from "@/lib/uploadImage";

import { ProductType } from "@/types/Product";

import toast from "react-hot-toast";

const MIN_IMAGES = 4;
const MAX_IMAGES = 8;

const initialState: ProductType = {
  productName: "",
  imageURL: "",
  imageURLs: [],
  price: 0,
  stock: 0,
  category: "",
  brand: "",
  description: "",
  sku: "",
  discountPercentage: 0,
  isNew: true, // freshly created products default to "New"
  isFeatured: false,
  isActive: true, // visible on the storefront by default
};

export default function AddProductPage() {
  const router = useRouter();

  const [product, setProduct] = useState(initialState);

  const [progress, setProgress] = useState(0);

  const [loading, setLoading] = useState(false);

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - product.imageURLs.length;
    if (remainingSlots <= 0) {
      toast.error(`You can only add up to ${MAX_IMAGES} images.`);
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} allowed — the rest were skipped.`);
    }

    try {
      const newUrls = await uploadMultipleImages(filesToUpload, setProgress);
      setProduct((prev) => ({
        ...prev,
        imageURLs: [...prev.imageURLs, ...newUrls],
      }));
    } catch (err) {
      console.error(err);
      toast.error("One or more images failed to upload. Please try again.");
    } finally {
      // Reset progress after a short delay so the "100%" state is visible
      setTimeout(() => setProgress(0), 800);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (product.imageURLs.length < MIN_IMAGES) {
      toast.error(`Please add at least ${MIN_IMAGES} images.`);
      return;
    }

    setLoading(true);

    // Cover image is always the first image in the gallery
    const finalProduct: ProductType = {
      ...product,
      imageURL: product.imageURLs[0],
    };

    const res = await addProduct(finalProduct);

    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setProduct(initialState);
    } else {
      toast.error(res.message);
    }

    if (res.success) {
      router.push("/admin-panel/all-products");
    }
  };

  return (
    <Productform
      product={product}
      setProduct={setProduct}
      onSubmit={handleSubmit}
      progress={progress}
      loading={loading}
      handleImages={handleImages}
      buttonText="Add Product"
      title="Create Product"
    />
  );
}



// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Productform from "@/components/Admin/productform/Productform";

// import { addProduct } from "@/lib/Actions/Product.action";

// import { uploadMultipleImages } from "@/lib/uploadImage";

// import { ProductType } from "@/types/Product";

// import toast from "react-hot-toast";

// const MIN_IMAGES = 4;
// const MAX_IMAGES = 8;

// const initialState: ProductType = {
//   productName: "",
//   imageURL: "",
//   imageURLs: [],
//   price: 0,
//   stock: 0,
//   category: "",
//   brand: "",
//   description: "",
// };

// export default function AddProductPage() {
//   const router = useRouter();

//   const [product, setProduct] = useState(initialState);

//   const [progress, setProgress] = useState(0);

//   const [loading, setLoading] = useState(false);

//   const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files ?? []);
//     if (files.length === 0) return;

//     const remainingSlots = MAX_IMAGES - product.imageURLs.length;
//     if (remainingSlots <= 0) {
//       toast.error(`You can only add up to ${MAX_IMAGES} images.`);
//       e.target.value = "";
//       return;
//     }

//     const filesToUpload = files.slice(0, remainingSlots);
//     if (files.length > remainingSlots) {
//       toast.error(`Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} allowed — the rest were skipped.`);
//     }

//     try {
//       const newUrls = await uploadMultipleImages(filesToUpload, setProgress);
//       setProduct((prev) => ({
//         ...prev,
//         imageURLs: [...prev.imageURLs, ...newUrls],
//       }));
//     } catch (err) {
//       console.error(err);
//       toast.error("One or more images failed to upload. Please try again.");
//     } finally {
//       // Reset progress after a short delay so the "100%" state is visible
//       setTimeout(() => setProgress(0), 800);
//       e.target.value = "";
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (product.imageURLs.length < MIN_IMAGES) {
//       toast.error(`Please add at least ${MIN_IMAGES} images.`);
//       return;
//     }

//     setLoading(true);

//     // Cover image is always the first image in the gallery
//     const finalProduct: ProductType = {
//       ...product,
//       imageURL: product.imageURLs[0],
//     };

//     const res = await addProduct(finalProduct);

//     setLoading(false);

//     if (res.success) {
//       toast.success(res.message);
//       setProduct(initialState);
//     } else {
//       toast.error(res.message);
//     }

//     if (res.success) {
//       router.push("/admin-panel/all-products");
//     }
//   };

//   return (
//     <Productform
//       product={product}
//       setProduct={setProduct}
//       onSubmit={handleSubmit}
//       progress={progress}
//       loading={loading}
//       handleImages={handleImages}
//       buttonText="Add Product"
//       title="Create Product"
//     />
//   );
// }


