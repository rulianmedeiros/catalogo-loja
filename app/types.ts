export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  gallery?: string[]; // Array de URLs
  size?: string;
  variants?: ProductVariant[]; // Variações de tamanho/preço
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  whatsapp_number: string;
  admin_password_hash: string;
  banner_url: string;
  banner_link?: string; // NOVO: Link do Banner
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant | null;
}