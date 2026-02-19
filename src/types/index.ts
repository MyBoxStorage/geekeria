export type Gender = 'masculino' | 'feminino' | 'unissex';

export interface ProductImage {
  url: string;
  alt?: string;
  type?: 'model' | 'product' | 'detail';
  gender?: 'masculino' | 'feminino';
}

export interface GenderStock {
  available: boolean;
  sizes: string[];
}

export interface ColorStockItem {
  id: string;
  name: string;
  hex: string;
  image: string | null;
  stock: {
    feminino: GenderStock;
    masculino: GenderStock;
  };
}

export interface Product {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  images?: ProductImage[] | null;
  category: string;
  gender: Gender;
  sizes: string[];
  colors: string[];
  rating?: number;
  reviews?: number;
  badge?: string | null;
  isNew?: boolean;
  isBestseller?: boolean;
  colorStock?: ColorStockItem[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoTags?: string[];
  isPublished?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  state: string;
  rating?: number;
  text: string;
  avatar?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export type Category = 'all' | 'camisetas' | 'bone' | 'moletom' | 'polo' | 'infantil' | 'acessorios';
export type Size = 'P' | 'M' | 'G' | 'GG' | 'XG';
export type Color = 'preto' | 'branco' | 'verde' | 'azul' | 'cinza' | 'amarelo';
export type SortOption = 'bestsellers' | 'price-asc' | 'price-desc' | 'newest';
