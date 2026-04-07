import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetail from "@/components/products/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!product) return {};

  return {
    title: `${product.name} | Bilu Bikes`,
    description: product.description || `${product.name} — Bilu Bikes`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: { include: { parent: true } },
      variants: true,
    },
  });

  if (!product) notFound();

  // Related products
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      active: true,
      NOT: { id: product.id },
    },
    take: 4,
    include: { category: true, variants: true },
  });

  return <ProductDetail product={product} related={related} />;
}
