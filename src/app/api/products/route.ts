import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/products';

export async function GET(request: NextRequest) {
  const products = getProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const product = createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
