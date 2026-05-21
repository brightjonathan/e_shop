"use client";

import Productform from "@/components/Admin/productform/Productform";
import { useRouter } from "next/navigation";

import {
  getProduct,
  updateProduct,
} from  "@/lib/Actions/Product.action";

import { uploadImage } from "@/lib/uploadImage";

import { ProductType } from "@/types/Product";

import {
  useEffect,
  useState,
} from "react";

import { useParams } from "next/navigation";

import toast from 'react-hot-toast';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] =
    useState<ProductType>({
      productName: "",
      imageURL: "",
      price: 0,
      category: "",
      brand: "",
      description: "",
    });

  const [progress, setProgress] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const fetchProduct =
      async () => {
        const data =
          await getProduct(id);

        if (data) {
          setProduct(data as ProductType);
        }
      };

    fetchProduct();
  }, [id]);

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
      await updateProduct(
        id,
        product
      );

    setLoading(false);

    if (res.success) {
      toast.success(res.message);
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
      buttonText="Update Product"
      title="Edit Product"
    />
  );
}