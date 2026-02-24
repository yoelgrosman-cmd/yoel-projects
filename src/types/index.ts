export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  subcategory?: string;
  brand: string;
  images: string[];
  stock: number;
  featured: boolean;
  specs?: Record<string, string>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}
