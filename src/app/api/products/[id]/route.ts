export const dynamic = 'force-static';

import { NextRequest, NextResponse } from 'next/server';
import productsData from '@/lib/data/products.json';
import { Product } from '@/types';

export async function generateStaticParams() {
  return (productsData as unknown as Product[]).map((p) => ({ id: p.id }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = (productsData as unknown as Product[]).find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT() {
  return NextResponse.json({ error: 'Not available in static mode' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not available in static mode' }, { status: 405 });
}
