import productsData from '@/lib/data/products.json';
import { Product } from '@/types';
import EditProductClient from './EditProductClient';

export async function generateStaticParams() {
  return (productsData as unknown as Product[]).map((p) => ({ id: p.id }));
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditProductClient id={id} />;
}
