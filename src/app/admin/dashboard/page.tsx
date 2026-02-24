'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { CATEGORIES } from '@/lib/categories';

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק מוצר זה?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(products.filter((p) => p.id !== id));
  };

  const filtered = products
    .filter((p) => !categoryFilter || p.category === categoryFilter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));

  const totalValue = products.reduce((sum, p) => sum + (p.salePrice ?? p.price) * p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Admin Header */}
      <header className="bg-blue-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold">BB</div>
            <div>
              <div className="font-black text-lg">BILU BIKES</div>
              <div className="text-xs text-blue-300">ממשק ניהול</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="text-blue-300 hover:text-white text-sm transition-colors">
              🌐 צפייה באתר
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-800 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
            >
              התנתקות
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'סה"כ מוצרים', value: products.length, icon: '📦', color: 'bg-blue-500' },
            { label: 'שווי מלאי', value: `₪${totalValue.toLocaleString()}`, icon: '💰', color: 'bg-green-500' },
            { label: 'חסרים במלאי', value: outOfStock, icon: '⚠️', color: 'bg-red-500' },
            { label: 'קטגוריות', value: CATEGORIES.length, icon: '🗂️', color: 'bg-purple-500' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}>{icon}</div>
              <div className="text-2xl font-black text-gray-800">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-gray-800">ניהול מוצרים</h2>
            <Link
              href="/admin/products/new"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              <span>+</span>
              הוספת מוצר
            </Link>
          </div>

          {/* Filters */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מוצר..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">כל הקטגוריות</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-gray-400">טוען...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-right">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">מוצר</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">קטגוריה</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">מחיר</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">מלאי</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">מומלץ</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🚲</div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORIES.find((c) => c.id === product.category)?.name || product.category}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-900">₪{(product.salePrice ?? product.price).toLocaleString()}</div>
                        {product.salePrice && (
                          <div className="text-xs text-gray-400 line-through">₪{product.price.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' :
                          product.stock <= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {product.stock === 0 ? 'אזל' : product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg`}>{product.featured ? '⭐' : '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            עריכה
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            מחיקה
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p>לא נמצאו מוצרים</p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            מציג {filtered.length} מתוך {products.length} מוצרים
          </div>
        </div>
      </div>
    </div>
  );
}
