import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Package } from "lucide-react";
import { formatPrice, parseImages, getImageUrl } from "@/lib/utils";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (sp.search) where.name = { contains: sp.search };
  if (sp.category) where.categoryId = sp.category;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a2744]">מוצרים</h1>
          <p className="text-gray-400 mt-1">{total} מוצרים סה״כ</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={18} />
          מוצר חדש
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="חיפוש מוצר..."
          className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:border-[#1e5fa8] font-medium flex-1 max-w-xs"
        />
        <select
          name="category"
          defaultValue={sp.category}
          className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:border-[#1e5fa8] font-medium"
        >
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#1a2744] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1e5fa8] transition-colors"
        >
          חיפוש
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-right text-sm text-gray-400 font-bold bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-4">מוצר</th>
              <th className="px-4 py-4">קטגוריה</th>
              <th className="px-4 py-4">מחיר</th>
              <th className="px-4 py-4">מלאי</th>
              <th className="px-4 py-4">סטטוס</th>
              <th className="px-4 py-4">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const images = parseImages(product.images);
              const img = getImageUrl(images[0]);
              return (
                <tr
                  key={product.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <Image
                          src={img}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#1a2744] text-sm">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-gray-400">
                            מק״ט: {product.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {product.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-black text-[#1a2744]">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold text-sm ${
                        product.stock === 0
                          ? "text-red-500"
                          : product.stock < 5
                          ? "text-yellow-500"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        product.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.active ? "פעיל" : "מושבת"}
                    </span>
                    {product.featured && (
                      <span className="mr-1 px-2 py-1 rounded-lg text-xs font-bold bg-[#4db8e8]/20 text-[#1e5fa8]">
                        מובחר
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="inline-flex items-center gap-1 text-[#1e5fa8] hover:text-[#1a2744] font-bold text-sm"
                    >
                      <Edit size={14} />
                      עריכה
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">לא נמצאו מוצרים</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${sp.search ? `&search=${sp.search}` : ""}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                p === page
                  ? "bg-[#1a2744] text-white"
                  : "bg-white border border-gray-200 text-gray-600"
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
