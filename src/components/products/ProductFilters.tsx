"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

interface Props {
  categories: Category[];
  currentParams: Record<string, string | undefined>;
}

export default function ProductFilters({ categories, currentParams }: Props) {
  const router = useRouter();
  const [priceRange, setPriceRange] = useState({
    min: currentParams.minPrice || "",
    max: currentParams.maxPrice || "",
  });

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== key && k !== "page") params.set(k, v);
    });
    if (value) params.set(key, value);
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => router.push("/products");

  const hasFilters = Object.values(currentParams).some(Boolean);

  const sortOptions = [
    { value: "featured", label: "מומלצים" },
    { value: "newest", label: "חדש ביותר" },
    { value: "price_asc", label: "מחיר: נמוך לגבוה" },
    { value: "price_desc", label: "מחיר: גבוה לנמוך" },
  ];

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600"
        >
          <X size={16} />
          נקה פילטרים
        </button>
      )}

      {/* Sort */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-[#1a2744] mb-4">מיון</h3>
        <div className="space-y-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("sort", opt.value)}
              className={`w-full text-right py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                (currentParams.sort || "featured") === opt.value
                  ? "bg-[#1a2744] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-[#1a2744] mb-4">קטגוריות</h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => updateFilter("category", cat.slug)}
                className={`w-full text-right py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                  currentParams.category === cat.slug
                    ? "bg-[#1e5fa8] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
              {cat.children.length > 0 && (
                <div className="pr-3 mt-1 space-y-1">
                  {cat.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => updateFilter("category", child.slug)}
                      className={`w-full text-right py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                        currentParams.category === child.slug
                          ? "bg-[#4db8e8]/20 text-[#1e5fa8] font-bold"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-[#1a2744] mb-4">מותג</h3>
        <div className="space-y-2">
          {[{ value: "RL", label: "RL — מותג בלעדי" }].map((brand) => (
            <button
              key={brand.value}
              onClick={() =>
                updateFilter(
                  "brand",
                  currentParams.brand === brand.value ? null : brand.value
                )
              }
              className={`w-full text-right py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentParams.brand === brand.value
                  ? "bg-[#1a2744] text-[#4db8e8] font-bold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {brand.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-[#1a2744] mb-4">טווח מחיר</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="מינ׳"
            value={priceRange.min}
            onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-[#1e5fa8]"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="מקס׳"
            value={priceRange.max}
            onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-[#1e5fa8]"
          />
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            Object.entries(currentParams).forEach(([k, v]) => {
              if (v && k !== "minPrice" && k !== "maxPrice" && k !== "page")
                params.set(k, v);
            });
            if (priceRange.min) params.set("minPrice", priceRange.min);
            if (priceRange.max) params.set("maxPrice", priceRange.max);
            router.push(`/products?${params.toString()}`);
          }}
          className="mt-3 w-full py-2 bg-[#1a2744] text-white rounded-lg text-sm font-bold hover:bg-[#1e5fa8] transition-colors"
        >
          החל
        </button>
      </div>
    </div>
  );
}
