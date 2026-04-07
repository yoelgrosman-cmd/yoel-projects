import Link from "next/link";
import Image from "next/image";
import { formatPrice, parseImages, getImageUrl } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string;
  brand: string | null;
  featured: boolean;
  category: { id: string; name: string; slug: string } | null;
}

interface Props {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ProductGrid({ products, total, page, pageSize }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">
          לא נמצאו מוצרים
        </h3>
        <p className="text-gray-400">נסה לשנות את הפילטרים</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {products.map((product) => {
          const images = parseImages(product.images);
          const mainImage = getImageUrl(images[0]);
          const isOnSale =
            product.comparePrice && product.comparePrice > product.price;
          const discount = isOnSale
            ? Math.round(
                ((product.comparePrice! - product.price) /
                  product.comparePrice!) *
                  100
              )
            : 0;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {isOnSale && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                      -{discount}%
                    </div>
                  )}
                  {product.brand === "RL" && (
                    <div className="absolute top-2 left-2 bg-[#1a2744] text-[#4db8e8] text-xs font-black px-2 py-0.5 rounded-lg">
                      RL
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                {product.category && (
                  <p className="text-xs text-gray-400 mb-1">
                    {product.category.name}
                  </p>
                )}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-bold text-[#1a2744] text-sm leading-tight line-clamp-2 mb-3 hover:text-[#1e5fa8] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-[#1a2744]">
                      {formatPrice(product.price)}
                    </div>
                    {isOnSale && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatPrice(product.comparePrice!)}
                      </div>
                    )}
                  </div>
                  <AddToCartButton product={product} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                p === page
                  ? "bg-[#1a2744] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
