import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages, getImageUrl } from "@/lib/utils";
import AddToCartButton from "@/components/products/AddToCartButton";

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[#4db8e8] font-bold text-sm uppercase tracking-widest mb-2 block">
              מוצרים נבחרים
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#1a2744]">
              המובחרים שלנו
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden sm:flex items-center gap-2 text-[#1e5fa8] font-bold hover:gap-3 transition-all"
          >
            כל המוצרים <ArrowLeft size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const images = parseImages(product.images);
            const mainImage = getImageUrl(images[0]);
            const isOnSale = product.comparePrice && product.comparePrice > product.price;
            const discount = isOnSale
              ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
              : 0;

            return (
              <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {isOnSale && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                        -{discount}%
                      </div>
                    )}
                    {product.brand === "RL" && (
                      <div className="absolute top-3 left-3 bg-[#1a2744] text-[#4db8e8] text-xs font-black px-2 py-1 rounded-lg">
                        RL
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  {product.category && (
                    <p className="text-xs text-gray-400 font-medium mb-1">
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
                      <div className="text-lg font-black text-[#1a2744]">
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
      </div>
    </section>
  );
}
