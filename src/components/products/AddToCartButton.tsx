"use client";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { parseImages, getImageUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string;
  variants?: Array<{ id: string; name: string; value: string }>;
}

interface Props {
  product: Product;
  compact?: boolean;
  selectedVariantId?: string;
  selectedVariantLabel?: string;
}

export default function AddToCartButton({
  product,
  compact = false,
  selectedVariantId,
  selectedVariantLabel,
}: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const images = parseImages(product.images);
  const mainImage = getImageUrl(images[0]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: `${product.id}-${selectedVariantId || "default"}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      variant: selectedVariantLabel,
      variantId: selectedVariantId,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          added
            ? "bg-green-500 text-white"
            : "bg-[#1a2744] text-white hover:bg-[#1e5fa8]"
        }`}
        aria-label="הוסף לעגלה"
      >
        {added ? <Check size={16} /> : <ShoppingCart size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`btn-primary w-full text-lg py-4 transition-all duration-200 ${
        added
          ? "!bg-green-500 hover:!bg-green-500"
          : ""
      }`}
    >
      {added ? (
        <>
          <Check size={20} />
          נוסף לעגלה!
        </>
      ) : (
        <>
          <ShoppingCart size={20} />
          הוסף לעגלה
        </>
      )}
    </button>
  );
}
