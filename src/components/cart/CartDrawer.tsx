"use client";
import { useCartStore } from "@/store/cartStore";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getImageUrl } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-[#1a2744] text-white">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} />
            <h2 className="text-xl font-bold">עגלת הקניות</h2>
            {items.length > 0 && (
              <span className="bg-[#4db8e8] text-[#1a2744] text-xs font-black px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <ShoppingBag size={40} className="text-gray-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-700 mb-2">העגלה ריקה</p>
                <p className="text-gray-400">הוסף מוצרים כדי להתחיל</p>
              </div>
              <button
                onClick={closeCart}
                className="btn-primary"
              >
                המשך לקנות
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a2744] text-sm leading-tight mb-1 truncate">
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mb-2">{item.variant}</p>
                    )}
                    <p className="font-black text-[#1e5fa8]">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.variantId
                          )
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-gray-300 hover:text-red-500 transition-colors self-start mt-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t bg-gray-50">
            {totalPrice() < 250 && (
              <div className="mb-4 p-3 bg-[#4db8e8]/10 rounded-lg text-center">
                <p className="text-sm font-semibold text-[#1e5fa8]">
                  עוד {formatPrice(250 - totalPrice())} למשלוח חינם!
                </p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4db8e8] rounded-full transition-all"
                    style={{ width: `${(totalPrice() / 250) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {totalPrice() >= 250 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg text-center border border-green-100">
                <p className="text-sm font-bold text-green-600">
                  משלוח חינם! 🎉
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600">סה״כ</span>
              <span className="text-2xl font-black text-[#1a2744]">
                {formatPrice(totalPrice())}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center justify-center text-lg"
            >
              לתשלום
            </Link>
            <button
              onClick={closeCart}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              המשך לקנות
            </button>
          </div>
        )}
      </div>
    </>
  );
}
