"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types';
import { api } from '../services/dataService';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  checkoutWhatsApp: () => Promise<void>;
  formatPrice: (value: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper para gerar ID único do item no carrinho
  const getCartItemId = (item: CartItem) => {
    return item.variant 
      ? `${item.product.id}-${item.variant.id}` 
      : `${item.product.id}-default`;
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setItems(prev => {
      // Verifica se o item já existe (mesmo produto E mesma variante)
      const existing = prev.find(item => 
        item.product.id === product.id && item.variant?.id === variant?.id
      );

      if (existing) {
        return prev.map(item => {
          if (item.product.id === product.id && item.variant?.id === variant?.id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
      }

      // Adiciona novo item com a nova estrutura { product, quantity, variant }
      return [...prev, { product, quantity: 1, variant }];
    });
    
    setIsSidebarOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => getCartItemId(item) !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (getCartItemId(item) === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Cálculo do total considerando preço da variante se houver
  const totalPrice = items.reduce((acc, item) => {
    const price = item.variant ? item.variant.price : item.product.price;
    return acc + (price * item.quantity);
  }, 0);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const checkoutWhatsApp = async () => {
    try {
      const settings = await api.getSettings();
      // Garante que temos um número, se não tiver usa um fallback ou string vazia
      const phone = settings?.whatsapp_number?.replace(/\D/g, '') || '';
      const storeName = settings?.store_name || 'Loja';
      
      let message = `*Novo Pedido - ${storeName}*\n\n`;
      message += `------------------------------\n`;

      items.forEach(item => {
        const price = item.variant ? item.variant.price : item.product.price;
        const totalItemPrice = price * item.quantity;
        
        // Nome do item com o tamanho específico se houver variante
        const variantName = item.variant ? `(${item.variant.name})` : '';
        const productName = `${item.product.name} ${variantName}`;

        message += `*${item.quantity}x ${productName}*\n`;
        
        // Se for produto simples e tiver size definido na descrição ou campo size
        if (!item.variant && item.product.size) {
           message += `   (Tamanho: ${item.product.size})\n`;
        }
        
        message += `   Unitário: ${formatPrice(price)}\n`;
        message += `   Subtotal: ${formatPrice(totalItemPrice)}\n\n`;
      });
      
      message += `------------------------------\n`;
      message += `*Valor Total: ${formatPrice(totalPrice)}*\n`;
      message += `------------------------------\n\n`;
      
      message += `Taxa de entrega: A calcular\n`;
      message += `Horário de entrega: A combinar\n\n`;
      message += `Aguardo confirmação!`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao gerar link do WhatsApp:", error);
      alert("Erro ao conectar com o WhatsApp. Tente novamente.");
    }
  };

  return (
    <CartContext.Provider value={{ 
      items, addToCart, removeFromCart, updateQuantity, clearCart, 
      totalPrice, totalItems, isSidebarOpen, toggleSidebar, checkoutWhatsApp, formatPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};