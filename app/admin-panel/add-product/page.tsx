"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Productform from "@/components/Admin/productform/Productform";

import { addProduct } from "@/lib/Actions/Product.action";

import { uploadImage } from "@/lib/uploadImage";

import { ProductType } from "@/types/Product";

import toast from 'react-hot-toast';

const initialState: ProductType = {
  productName: "",
  imageURL: "",
  price: 0,
  category: "",
  brand: "",
  description: "",
};

export default function AddProductPage() {

    const router = useRouter();

  const [product, setProduct] =
    useState(initialState);

  const [progress, setProgress] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const handleImage = async (
    e: any
  ) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageURL = await uploadImage(
      file,
      setProgress
    );

    setProduct({
      ...product,
      imageURL,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    const res =
      await addProduct(product);

    setLoading(false);

    if (res.success) {
      toast.success(res.message);

      setProduct(initialState);
    } else {
      toast.error(res.message);
    }

     if (res.success) {
      router.push("/admin/all-products"); // 👈 redirect here
    }
  };

  return (
    <Productform
      product={product}
      setProduct={setProduct}
      onSubmit={handleSubmit}
      progress={progress}
      loading={loading}
      handleImage={handleImage}
      buttonText="Add Product"
      title="Create Product"
    />
  );
}