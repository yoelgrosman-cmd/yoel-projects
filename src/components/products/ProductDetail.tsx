"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShoppingCart, Shield, Truck, RefreshCw } from "lucide-react";
import { formatPrice, parseImages, getImageUrl } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";

interface Variant {
  id: string;
  name: string;
  value: string;
  stock: number;
  price: number | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string;
  brand: string | null;
  featured: boolean;
  variants: Variant[];
  category: { id: string; name: string; slug: string } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  images: string;
  brand: string | null;
  featured: boolean;
  variants: Variant[];
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; name: string; slug: string } | null;
  } | null;
}

interface Props {
  product: Product;
  related: RelatedProduct[];
}

export default function ProductDetail({ product, related }: Props) {
  const images = parseImages(product.images);
  const allImages = images.length > 0 ? images : ["/images/placeholder.jpg"];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Group variants by name
  const variantGroups = product.variants.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {} as Record<string, Variant[]>);

  const isOnSale = product.comparePrice && product.comparePrice > product.price;
  const discount = isOnSale
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  // Find selected variant to get variant label for cart
  const selectedVariantLabel = Object.entries(selectedVariants)
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-[#1e5fa8]">ראשי</Link>
            <ChevronRight size={14} />
            <Link href="/products" className="hover:text-[#1e5fa8]">מוצרים</Link>
            {product.category && (
              <>
                <ChevronRight size={14} />
                {product.category.parent && (
                  <>
                    <Link
                      href={`/categories/${product.category.parent.slug}`}
                      className="hover:text-[#1e5fa8]"
                    >
                      {product.category.parent.name}
                    </Link>
                    <ChevronRight size={14} />
                  </>
                )}
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-[#1e5fa8]"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight size={14} />
            <span className="text-[#1a2744] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
              <Image
                src={getImageUrl(allImages[selectedImage])}
                alt={product.name}
                fill
                className="object-contain p-8"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {isOnSale && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl">
                  -{discount}%
                </div>
              )}
              {product.brand === "RL" && (
                <div className="absolute top-4 left-4 bg-[#1a2744] text-[#4db8e8] text-sm font-black px-3 py-1.5 rounded-xl">
                  RL
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                      i === selectedImage
                        ? "border-[#1e5fa8]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`תמונה ${i + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#4db8e8] font-bold text-sm uppercase tracking-wide hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl lg:text-4xl font-black text-[#1a2744] mt-2 mb-4 leading-tight">
              {product.name}
            </h1>

            {product.sku && (
              <p className="text-gray-400 text-sm mb-4">מק״ט: {product.sku}</p>
            )}

            {/* Price */}
            <div className="flex items-end gap-4 mb-6">
              <div className="text-4xl font-black text-[#1a2744]">
                {formatPrice(product.price)}
              </div>
              {isOnSale && (
                <div className="text-xl text-gray-400 line-through pb-1">
                  {formatPrice(product.comparePrice!)}
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-2 text-green-600 font-bold text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  במלאי
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-red-500 font-bold text-sm">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  אזל מהמלאי
                </span>
              )}
            </div>

            {/* Variants */}
            {Object.entries(variantGroups).map(([groupName, variants]) => (
              <div key={groupName} className="mb-6">
                <p className="font-bold text-[#1a2744] mb-3">
                  {groupName}:{" "}
                  <span className="font-normal text-gray-500">
                    {selectedVariants[groupName] || "בחר"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        setSelectedVariants((prev) => ({
                          ...prev,
                          [groupName]: v.value,
                        }))
                      }
                      disabled={v.stock === 0}
                      className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                        selectedVariants[groupName] === v.value
                          ? "border-[#1e5fa8] bg-[#1e5fa8] text-white"
                          : v.stock === 0
                          ? "border-gray-200 text-gray-300 cursor-not-allowed"
                          : "border-gray-200 text-gray-700 hover:border-[#1e5fa8]"
                      }`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Add to Cart */}
            <div className="mb-8">
              <AddToCartButton
                product={product}
                selectedVariantLabel={selectedVariantLabel}
              />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
              {[
                { icon: Truck, label: "משלוח חינם מ-₪250" },
                { icon: Shield, label: "אחריות מלאה" },
                { icon: RefreshCw, label: "החזרה קלה" },
              ].map((badge) => (
                <div key={badge.label} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <badge.icon size={20} className="text-[#1e5fa8]" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">{badge.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t border-gray-100">
                <h2 className="font-bold text-[#1a2744] text-lg mb-3">
                  תיאור המוצר
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-black text-[#1a2744] mb-8">
              מוצרים דומים
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => {
                const imgs = parseImages(p.images);
                const img = getImageUrl(imgs[0]);
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#1a2744] text-sm line-clamp-2 mb-2">
                        {p.name}
                      </h3>
                      <p className="font-black text-[#1e5fa8]">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
