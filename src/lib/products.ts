import 'server-only';
import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
export { CATEGORIES } from './categories';

const DATA_FILE = path.join(process.cwd(), 'src/lib/data/products.json');

export function getProducts(): Product[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return getProducts().filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return getProducts().filter((p) => p.featured);
}

export function saveProducts(products: Product[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

export function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}
