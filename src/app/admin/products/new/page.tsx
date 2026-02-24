'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { Product } from '@/types';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Product>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
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
          <Link href="/admin/dashboard" className="text-blue-300 hover:text-white transition-colors">
            → לוח בקרה
          </Link>
          <span className="text-blue-600">/</span>
          <span className="font-bold">הוספת מוצר חדש</span>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-8">הוספת מוצר חדש</h1>
        <ProductForm onSubmit={handleSubmit} submitLabel="הוספת מוצר" />
      </div>
    </div>
  );
}
