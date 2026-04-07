export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  variantId?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  images: string;
  brand: string | null;
  featured: boolean;
  active: boolean;
  category: { id: string; name: string; slug: string } | null;
  variants: Variant[];
}

export interface Variant {
  id: string;
  name: string;
  value: string;
  stock: number;
  price: number | null;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  shippingType: string;
  branchPickup: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentStatus: string;
  tranzilaRef: string | null;
  notes: string | null;
  createdAt: Date;
  items: OrderItemWithProduct[];
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string | null;
  } | null;
}

export interface OrderItemWithProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
  product: { slug: string; images: string } | null;
}
