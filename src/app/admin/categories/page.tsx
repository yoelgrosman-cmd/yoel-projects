import { prisma } from "@/lib/prisma";
import CategoriesManager from "@/components/admin/CategoriesManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1a2744]">קטגוריות</h1>
        <p className="text-gray-400 mt-1">נהל את קטגוריות המוצרים</p>
      </div>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
