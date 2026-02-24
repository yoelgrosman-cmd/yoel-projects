import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import productsData from '@/lib/data/products.json';
import { Product } from '@/types';

export async function generateStaticParams() {
  return (productsData as unknown as Product[]).map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = (productsData as unknown as Product[]).find((p) => p.id === id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
