import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/products/ProductGrid";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });

  if (!category) notFound();

  // Include sub-category products
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const page = parseInt(sp.page || "1");
  const pageSize = 24;

  const orderBy: Record<string, string> =
    sp.sort === "price_asc"
      ? { price: "asc" }
      : sp.sort === "price_desc"
      ? { price: "desc" }
      : { featured: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: { in: categoryIds }, active: true },
      include: { category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({
      where: { categoryId: { in: categoryIds }, active: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a2744] py-12">
        <div className="container-custom">
          {category.parent && (
            <p className="text-[#4db8e8] font-semibold text-sm mb-2">
              {category.parent.name}
            </p>
          )}
          <h1 className="text-4xl font-black text-white mb-2">
            {category.name}
          </h1>
          <p className="text-white/50">{total} מוצרים</p>
        </div>
      </div>

      <div className="container-custom py-10">
        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/categories/${child.slug}`}
                className="px-4 py-2 bg-white rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:border-[#1e5fa8] hover:text-[#1e5fa8] transition-colors"
              >
                {child.name}
              </a>
            ))}
          </div>
        )}
        <ProductGrid
          products={products}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
