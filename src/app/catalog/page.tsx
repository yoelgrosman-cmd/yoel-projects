'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import { CATEGORIES } from '@/lib/categories';
import { Suspense } from 'react';
import productsData from '@/lib/data/products.json';

function CatalogContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('name');
  const [search, setSearch] = useState('');
  const [priceMax, setPriceMax] = useState(50000);

  const products = productsData as unknown as Product[];

  useEffect(() => {
    const cat = searchParams.get('category') || '';
    setCategory(cat);
  }, [searchParams]);

  const filtered = products
    .filter((p) => !category || p.category === category)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (p.salePrice ?? p.price) <= priceMax)
    .sort((a, b) => {
      if (sort === 'price-asc') return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      if (sort === 'price-desc') return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      if (sort === 'name') return a.name.localeCompare(b.name, 'he');
      return 0;
    });

  const currentCat = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-blue-700">ראשי</a>
        <span>/</span>
        <span className="text-gray-800">קטלוג</span>
        {currentCat && (
          <>
            <span>/</span>
            <span className="text-gray-800">{currentCat.name}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">סינון מוצרים</h3>

            {/* Search */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-600 block mb-2">חיפוש</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="שם מוצר, מותג..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-600 block mb-2">קטגוריה</label>
              <div className="space-y-1">
                <button
                  onClick={() => setCategory('')}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  הכל
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                מחיר מקסימלי: ₪{priceMax.toLocaleString()}
              </label>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-orange-500"
                style={{ direction: 'ltr' }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>₪500</span>
                <span>₪50,000</span>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setCategory(''); setSearch(''); setPriceMax(50000); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg transition-colors"
            >
              איפוס סינון
            </button>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 text-sm">{filtered.length} מוצרים</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="name">מיון לפי שם</option>
              <option value="price-asc">מחיר: נמוך לגבוה</option>
              <option value="price-desc">מחיר: גבוה לנמוך</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-medium text-lg">לא נמצאו מוצרים</p>
              <p className="text-sm mt-1">נסה לשנות את הסינון</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-gray-400">טוען...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
