'use client';

import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import Image from 'next/image';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const total = totalPrice();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-blue-900 text-white">
          <h2 className="text-lg font-bold">עגלת הקניות</h2>
          <button onClick={closeCart} className="p-2 rounded-lg hover:bg-blue-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-500">
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-700">העגלה ריקה</p>
                <p className="text-sm">הוסף מוצרים כדי להתחיל</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                להמשיך בקנייה
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const price = item.product.salePrice ?? item.product.price;
                return (
                  <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full img-placeholder text-3xl">🚲</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm leading-tight line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-orange-600 font-bold mt-1">
                        ₪{price.toLocaleString()}
                      </p>

                      {/* Quantity */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-5 space-y-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">סה&quot;כ:</span>
              <span className="text-2xl font-black text-blue-900">₪{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {total >= 299 ? 'זכאי למשלוח חינם!' : `עוד ₪${(299 - total).toLocaleString()} למשלוח חינם`}
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-center transition-colors"
            >
              לתשלום
            </Link>
            <button
              onClick={clearCart}
              className="w-full py-2 text-gray-500 hover:text-red-500 text-sm transition-colors"
            >
              ניקוי עגלה
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
