'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32 text-gray-500">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-xl font-medium">המוצר לא נמצא</p>
        <Link href="/catalog" className="mt-6 inline-block px-6 py-3 bg-blue-700 text-white rounded-xl font-medium">
          חזרה לקטלוג
        </Link>
      </div>
    );
  }

  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-700">ראשי</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-blue-700">קטלוג</Link>
        <span>/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div>
          <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full img-placeholder">
                <span className="text-9xl opacity-20">🚲</span>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-lg font-black px-3 py-1.5 rounded-xl">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{product.brand}</span>
          <h1 className="text-3xl font-black text-gray-900 mt-2 leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="mt-6 flex items-end gap-4">
            <span className="text-4xl font-black text-blue-900">₪{displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <div className="flex flex-col">
                <span className="text-gray-400 line-through text-xl">₪{product.price.toLocaleString()}</span>
                <span className="text-red-500 text-sm font-bold">
                  חסכת ₪{(product.price - product.salePrice!).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mt-4 flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-green-700 font-medium text-sm">
                  {product.stock > 5 ? 'במלאי' : `נותרו ${product.stock} בלבד`}
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="text-red-600 font-medium text-sm">אזל המלאי</span>
              </>
            )}
          </div>

          {/* Quantity + Add */}
          {product.stock > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-600">כמות:</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.02]'
                }`}
              >
                {added ? '✓ נוסף לעגלה!' : '🛒 הוסף לעגלה'}
              </button>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: '🚚', text: 'משלוח חינם מ-₪299' },
              { icon: '↩️', text: 'החזרה תוך 30 יום' },
              { icon: '🛡️', text: 'אחריות יצרן' },
            ].map(({ icon, text }) => (
              <div key={text} className="text-center bg-gray-50 rounded-xl p-3">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-gray-600 leading-tight">{text}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="border-b border-gray-200 flex gap-1">
          {[
            { id: 'desc', label: 'תיאור המוצר' },
            { id: 'specs', label: 'מפרט טכני' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'desc' | 'specs')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === 'desc' ? (
            <p className="text-gray-700 leading-relaxed text-lg max-w-3xl">{product.description}</p>
          ) : (
            product.specs && Object.keys(product.specs).length > 0 ? (
              <div className="max-w-2xl">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specs).map(([key, value], i) => (
                      <tr key={key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-medium text-gray-700 w-1/3">{key}</td>
                        <td className="py-3 px-4 text-gray-600">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">אין מפרט טכני זמין למוצר זה</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
