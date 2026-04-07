import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters from "@/components/products/ProductFilters";

interface SearchParams {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  page?: string;
  featured?: string;
  [key: string]: string | undefined;
}

async function getProducts(params: SearchParams) {
  const where: Record<string, unknown> = { active: true };

  if (params.search) {
    where.name = { contains: params.search };
  }
  if (params.brand) {
    where.brand = params.brand;
  }
  if (params.featured === "true") {
    where.featured = true;
  }
  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice)
      (where.price as Record<string, number>).gte = parseFloat(params.minPrice);
    if (params.maxPrice)
      (where.price as Record<string, number>).lte = parseFloat(params.maxPrice);
  }

  const orderBy: Record<string, string> = {};
  switch (params.sort) {
    case "price_asc":
      orderBy.price = "asc";
      break;
    case "price_desc":
      orderBy.price = "desc";
      break;
    case "newest":
      orderBy.createdAt = "desc";
      break;
    default:
      orderBy.featured = "desc";
  }

  const page = parseInt(params.page || "1");
  const pageSize = 24;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { order: "asc" },
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ products, total, page, pageSize }, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero bar */}
      <div className="bg-[#1a2744] py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-black text-white mb-2">
            {params.search
              ? `תוצאות עבור "${params.search}"`
              : params.brand === "RL"
              ? 'כל מוצרי RL'
              : params.featured === "true"
              ? "המוצרים המובחרים"
              : "כל המוצרים"}
          </h1>
          <p className="text-white/50 font-medium">{total} מוצרים</p>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <ProductFilters categories={categories} currentParams={params} />
          </aside>

          {/* Products */}
          <main className="flex-1">
            <ProductGrid
              products={products}
              total={total}
              page={page}
              pageSize={pageSize}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
