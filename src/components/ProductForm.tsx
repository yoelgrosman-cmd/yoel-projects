'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';
import { CATEGORIES } from '@/lib/categories';

interface ProductFormProps {
  initial?: Partial<Product>;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({ initial = {}, onSubmit, submitLabel = 'שמירה' }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    price: initial.price?.toString() || '',
    salePrice: initial.salePrice?.toString() || '',
    category: initial.category || '',
    subcategory: initial.subcategory || '',
    brand: initial.brand || '',
    stock: initial.stock?.toString() || '0',
    featured: initial.featured || false,
    images: initial.images || [] as string[],
    tags: initial.tags?.join(', ') || '',
    specs: initial.specs ? JSON.stringify(initial.specs, null, 2) : '{}',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setForm((f) => ({ ...f, images: [url, ...f.images] }));
      } else {
        setError('שגיאה בהעלאת תמונה');
      }
    } catch {
      setError('שגיאה בהעלאת תמונה');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let specs: Record<string, string> = {};
      try { specs = JSON.parse(form.specs); } catch { specs = {}; }
      await onSubmit({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        category: form.category,
        subcategory: form.subcategory || undefined,
        brand: form.brand,
        stock: Number(form.stock),
        featured: form.featured,
        images: form.images,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        specs,
      });
    } catch {
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">פרטי מוצר</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם המוצר *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מותג *</label>
            <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="Trek, Specialized, Giant..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">קטגוריה *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
                <option value="">בחר...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תת-קטגוריה</label>
              <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="hardtail, saddles..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור *</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תגיות (מופרדות בפסיק)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
              placeholder="הרים, 29, סוספנציה" />
          </div>
        </div>

        {/* Pricing, Stock, Specs */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">מחיר ומלאי</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">מחיר רגיל (₪) *</label>
                <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">מחיר מבצע (₪)</label>
                <input type="number" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="ריק = ללא מבצע" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">כמות במלאי</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-5 h-5 rounded accent-orange-500"
              />
              <label htmlFor="featured" className="font-medium text-gray-700">הצג כמוצר מומלץ בדף הבית</label>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">מפרט טכני (JSON)</h3>
            <textarea
              rows={6}
              value={form.specs}
              onChange={(e) => setForm({ ...form, specs: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 resize-none font-mono text-sm"
              placeholder={"מסגרת, גלגלים..."}
              style={{ direction: 'ltr' }}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-5">תמונות מוצר</h3>

        <div className="flex flex-wrap gap-4 mb-4">
          {form.images.map((url, i) => (
            <div key={url} className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <Image src={url} alt={`image ${i}`} width={96} height={96} className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {i === 0 && <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">ראשית</span>}
            </div>
          ))}

          <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {uploading ? (
              <div className="text-gray-400 text-xs text-center">מעלה...</div>
            ) : (
              <>
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-400 mt-1">הוסף תמונה</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">
          ביטול
        </button>
        <button type="submit" disabled={saving}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors disabled:opacity-70">
          {saving ? 'שומר...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
