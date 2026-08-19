"use client";

import Productform from "@/components/Admin/productform/Productform";
import { useRouter } from "next/navigation";

import { getProduct, updateProduct } from "@/lib/Actions/Product.action";

import { uploadMultipleImages } from "@/lib/uploadImage";

import { ProductType } from "@/types/Product";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import toast from "react-hot-toast";

const MIN_IMAGES = 4;
const MAX_IMAGES = 8;

const emptyProduct: ProductType = {
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
  isNew: false,
  isFeatured: false,
  isActive: true,
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] = useState<ProductType>(emptyProduct);
  const [fetching, setFetching] = useState(true);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setFetching(true);
      const data = await getProduct(id);

      if (data) {
        const raw = data as ProductType;

        // Normalize legacy products that predate the stock/imageURLs/
        // discount/flag fields — fall back sensibly so editing an old
        // product doesn't crash or silently wipe data.
        setProduct({
          ...raw,
          stock: raw.stock ?? 0,
          imageURLs:
            raw.imageURLs && raw.imageURLs.length > 0
              ? raw.imageURLs
              : raw.imageURL
              ? [raw.imageURL]
              : [],
          discountPercentage: raw.discountPercentage ?? 0,
          isNew: raw.isNew ?? false,
          isFeatured: raw.isFeatured ?? false,
          // Older products predate this field entirely — default to
          // visible rather than silently hiding existing inventory.
          isActive: raw.isActive ?? true,
        });
      }
      setFetching(false);
    };

    fetchProduct();
  }, [id]);

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - product.imageURLs.length;
    if (remainingSlots <= 0) {
      toast.error(`You can only have up to ${MAX_IMAGES} images.`);
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
      setTimeout(() => setProgress(0), 800);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (product.imageURLs.length < MIN_IMAGES) {
      toast.error(`Please have at least ${MIN_IMAGES} images.`);
      return;
    }

    setLoading(true);

    const finalProduct: ProductType = {
      ...product,
      imageURL: product.imageURLs[0],
    };

    const res = await updateProduct(id, finalProduct);

    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    if (res.success) {
      router.push("/admin-panel/all-products");
    }
  };

  if (fetching) {
    return <p style={{ padding: 24, color: "#999" }}>Loading product…</p>;
  }

  return (
    <Productform
      product={product}
      setProduct={setProduct}
      onSubmit={handleSubmit}
      progress={progress}
      loading={loading}
      handleImages={handleImages}
      buttonText="Update Product"
      title="Edit Product"
    />
  );
}


// "use client";

// import Productform from "@/components/Admin/productform/Productform";
// import { useRouter } from "next/navigation";

// import { getProduct, updateProduct } from "@/lib/Actions/Product.action";

// import { uploadMultipleImages } from "@/lib/uploadImage";

// import { ProductType } from "@/types/Product";

// import { useEffect, useState } from "react";

// import { useParams } from "next/navigation";

// import toast from "react-hot-toast";

// const MIN_IMAGES = 4;
// const MAX_IMAGES = 8;

// const emptyProduct: ProductType = {
//   productName: "",
//   imageURL: "",
//   imageURLs: [],
//   price: 0,
//   stock: 0,
//   category: "",
//   brand: "",
//   description: "",
// };

// export default function EditProductPage() {
//   const params = useParams();
//   const router = useRouter();

//   const id = params.id as string;

//   const [product, setProduct] = useState<ProductType>(emptyProduct);
//   const [fetching, setFetching] = useState(true);

//   const [progress, setProgress] = useState(0);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchProduct = async () => {
//       setFetching(true);
//       const data = await getProduct(id);

//       if (data) {
//         const raw = data as ProductType;

//         // Normalize legacy products that predate the stock/imageURLs
//         // fields — fall back to their single old imageURL as the first
//         // (and only) gallery image so editing them doesn't crash or
//         // silently wipe their photo.
//         setProduct({
//           ...raw,
//           stock: raw.stock ?? 0,
//           imageURLs:
//             raw.imageURLs && raw.imageURLs.length > 0
//               ? raw.imageURLs
//               : raw.imageURL
//               ? [raw.imageURL]
//               : [],
//         });
//       }
//       setFetching(false);
//     };

//     fetchProduct();
//   }, [id]);

//   const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files ?? []);
//     if (files.length === 0) return;

//     const remainingSlots = MAX_IMAGES - product.imageURLs.length;
//     if (remainingSlots <= 0) {
//       toast.error(`You can only have up to ${MAX_IMAGES} images.`);
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
//       setTimeout(() => setProgress(0), 800);
//       e.target.value = "";
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (product.imageURLs.length < MIN_IMAGES) {
//       toast.error(`Please have at least ${MIN_IMAGES} images.`);
//       return;
//     }

//     setLoading(true);

//     const finalProduct: ProductType = {
//       ...product,
//       imageURL: product.imageURLs[0],
//     };

//     const res = await updateProduct(id, finalProduct);

//     setLoading(false);

//     if (res.success) {
//       toast.success(res.message);
//     } else {
//       toast.error(res.message);
//     }
//     if (res.success) {
//       router.push("/admin-panel/all-products");
//     }
//   };

//   if (fetching) {
//     return <p style={{ padding: 24, color: "#999" }}>Loading product…</p>;
//   }

//   return (
//     <Productform
//       product={product}
//       setProduct={setProduct}
//       onSubmit={handleSubmit}
//       progress={progress}
//       loading={loading}
//       handleImages={handleImages}
//       buttonText="Update Product"
//       title="Edit Product"
//     />
//   );
// }



