'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = product.salePrice ?? product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <div className="product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="relative block overflow-hidden bg-gray-50">
        <div className="aspect-[4/3] relative">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full img-placeholder">
              <span className="text-6xl opacity-30">🚲</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              מומלץ
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              אזל המלאי
            </span>
          )}
          {product.stock > 0 && product.stock <= 3 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              נותרו {product.stock}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brand */}
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
          {product.brand}
        </span>

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2 hover:text-blue-700 transition-colors mb-auto">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-3 flex items-end gap-2">
          <span className="text-2xl font-black text-blue-900">
            ₪{displayPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through mb-0.5">
              ₪{product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className={`mt-3 w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
          }`}
        >
          {product.stock === 0 ? 'אזל המלאי' : '+ הוסף לעגלה'}
        </button>
      </div>
    </div>
  );
}
