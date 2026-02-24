'use client';

import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const total = totalPrice();
  const shipping = total >= 299 ? 0 : 39;
  const grandTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-3xl font-black text-gray-800 mb-3">העגלה ריקה</h1>
        <p className="text-gray-500 mb-8">לא הוספת מוצרים לעגלה עדיין</p>
        <Link
          href="/catalog"
          className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors"
        >
          להמשיך בקנייה
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-blue-900 mb-8">עגלת הקניות</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            return (
              <div key={item.product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-5">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full img-placeholder text-3xl">🚲</div>
                  )}
                </div>

                <div className="flex-1">
                  <Link href={`/product/${item.product.id}`} className="font-bold text-gray-800 hover:text-blue-700 leading-tight">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{item.product.brand}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-blue-900 text-xl">
                        ₪{((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors py-2"
          >
            ניקוי עגלה
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-lg text-gray-800 mb-6">סיכום הזמנה</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>סה&quot;כ מוצרים</span>
                <span>₪{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>משלוח</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'חינם!' : `₪${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                  עוד ₪{(299 - total).toLocaleString()} למשלוח חינם
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-xl text-blue-900">
                <span>סה&quot;כ לתשלום</span>
                <span>₪{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors">
              לתשלום מאובטח
            </button>

            <div className="mt-4 flex justify-center gap-3">
              {['VISA', 'MC', 'PayPal', 'Bit'].map((p) => (
                <span key={p} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{p}</span>
              ))}
            </div>

            <Link href="/catalog" className="block mt-4 text-center text-sm text-gray-500 hover:text-blue-700 transition-colors">
              ← להמשיך בקנייה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
