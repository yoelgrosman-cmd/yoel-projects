"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { parseImages, getImageUrl } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Variant {
  id?: string;
  name: string;
  value: string;
  stock: number;
  price: number | null;
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
  active: boolean;
  categoryId: string | null;
  variants: Variant[];
}

interface Props {
  product?: Product;
  categories: Category[];
}

export default function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const isNew = !product;

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    comparePrice: product?.comparePrice?.toString() || "",
    sku: product?.sku || "",
    stock: product?.stock?.toString() || "0",
    brand: product?.brand || "",
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    categoryId: product?.categoryId || "",
    images: parseImages(product?.images),
  });

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants || []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm((f) => ({ ...f, images: [...f.images, newImageUrl.trim()] }));
      setNewImageUrl("");
    }
  };

  const removeImage = (i: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  };

  const addVariant = () => {
    setVariants((v) => [
      ...v,
      { name: "גודל", value: "", stock: 0, price: null },
    ]);
  };

  const removeVariant = (i: number) => {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  };

  const updateVariant = (i: number, field: keyof Variant, value: string | number | null) => {
    setVariants((v) => v.map((vv, idx) => (idx === i ? { ...vv, [field]: value } : vv)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock: parseInt(form.stock),
      images: JSON.stringify(form.images),
      variants,
    };

    const url = isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "שגיאה בשמירה");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("האם למחוק מוצר זה?")) return;
    setLoading(true);
    await fetch(`/api/admin/products/${product!.id}`, { method: "DELETE" });
    router.push("/admin/products");
  };

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-[#1a2744]">
          {isNew ? "מוצר חדש" : "עריכת מוצר"}
        </h1>
        <div className="flex gap-3">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              מחיקה
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? "שומר..." : "שמור"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-medium">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-5">פרטי מוצר</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">שם מוצר *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
                    setForm((f) => ({ ...f, name, slug }));
                  }}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug (URL) *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-5">מחיר ומלאי</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מחיר (₪) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                  step="0.01"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מחיר מקורי (₪)</label>
                <input
                  type="number"
                  value={form.comparePrice}
                  onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                  step="0.01"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מלאי</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">מק״ט</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-5">תמונות</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="הכנס URL של תמונה..."
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e5fa8]"
                dir="ltr"
              />
              <button
                type="button"
                onClick={addImage}
                className="btn-primary whitespace-nowrap"
              >
                <Plus size={16} />
                הוסף
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Image
                      src={getImageUrl(img)}
                      alt={`תמונה ${i + 1}`}
                      width={96}
                      height={96}
                      className="object-contain p-2 w-full h-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1a2744] text-lg">וריאנטים (גדלים/צבעים)</h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-[#1e5fa8] font-bold text-sm hover:text-[#1a2744]"
              >
                <Plus size={16} />
                הוסף וריאנט
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <select
                    value={v.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e5fa8] text-sm"
                  >
                    <option value="גודל">גודל</option>
                    <option value="צבע">צבע</option>
                  </select>
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => updateVariant(i, "value", e.target.value)}
                    placeholder="ערך (XL, אדום...)"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-[#1e5fa8] text-sm"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value))}
                    placeholder="מלאי"
                    className="w-20 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e5fa8] text-sm"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {variants.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  אין וריאנטים. לחץ "הוסף וריאנט" להוספה.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-5">פרסום</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-gray-700">פעיל</span>
                <div
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    form.active ? "bg-[#1e5fa8]" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      form.active ? "left-7" : "left-1"
                    }`}
                  />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-gray-700">מוצר מובחר</span>
                <div
                  onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    form.featured ? "bg-[#4db8e8]" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      form.featured ? "left-7" : "left-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-4">קטגוריה</h2>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
            >
              <option value="">ללא קטגוריה</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-[#1a2744] text-lg mb-4">מותג</h2>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              placeholder="RL, אחר..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#1e5fa8]"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
