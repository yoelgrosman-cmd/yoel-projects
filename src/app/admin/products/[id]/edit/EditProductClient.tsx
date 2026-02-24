'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { Product } from '@/types';
import productsData from '@/lib/data/products.json';

export default function EditProductClient({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) { setProduct(data); setLoading(false); return; }
        const found = (productsData as unknown as Product[]).find((p) => p.id === id);
        setProduct(found ?? null);
        setLoading(false);
      })
      .catch(() => {
        const found = (productsData as unknown as Product[]).find((p) => p.id === id);
        setProduct(found ?? null);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (data: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save');
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-blue-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-blue-300 hover:text-white transition-colors">→ לוח בקרה</Link>
          <span className="text-blue-600">/</span>
          <span className="font-bold">עריכת מוצר</span>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-8">
          {loading ? 'טוען...' : `עריכה: ${product?.name || 'מוצר לא נמצא'}`}
        </h1>
        {loading ? (
          <div className="text-center py-20 text-gray-400">טוען...</div>
        ) : !product ? (
          <div className="text-center py-20 text-gray-500">
            <p>המוצר לא נמצא</p>
            <Link href="/admin/dashboard" className="mt-4 inline-block px-6 py-2 bg-blue-700 text-white rounded-xl">חזרה</Link>
          </div>
        ) : (
          <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="שמירת שינויים" />
        )}
      </div>
    </div>
  );
}
