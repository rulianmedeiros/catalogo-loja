"use client";import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

  const addToCart = (product: Product, variant?: ProductVariant) => {
    // Se tiver variante, o preço e tamanho vêm dela. Se não, do produto base.
    const finalPrice = variant ? variant.price : product.price;
    const finalSize = variant ? variant.name : product.size;
    
    // Cria um ID único para o item no carrinho.
    // Se for variante: "prodID-varID". Se for simples: "prodID-default"
    const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;

    setItems(prev => {
      const existing = prev.find(item => {
          // Verifica se é o mesmo produto E a mesma variante (se houver)
          const itemVariantId = item.selectedVariant?.id;
          const newVariantId = variant?.id;
          return item.id === product.id && itemVariantId === newVariantId;
      });

      if (existing) {
        // Atualiza quantidade do item existente no carrinho (usando cartItemId não é estritamente necessário na busca, mas ajuda na lógica mental)
        return prev.map(item => {
             const itemVariantId = item.selectedVariant?.id;
             const newVariantId = variant?.id;
             if (item.id === product.id && itemVariantId === newVariantId) {
                 return { ...item, quantity: item.quantity + 1 };
             }
             return item;
        });
      }

      // Adiciona novo item
      const newItem: CartItem = {
          ...product,
          // Sobrescrevemos preço e tamanho para exibição no carrinho ficar correta
          price: finalPrice, 
          size: finalSize,
          quantity: 1,
          selectedVariant: variant,
          // Adicionamos uma propriedade interna para controle se necessário, mas o array indexa pelo objeto
      };
      // Hack: Vamos usar uma propriedade temporária 'cartId' se precisássemos, mas aqui vamos controlar pelo find acima.
      // Para facilitar remoção/update, vamos injetar o ID composto como propriedade auxiliar se o tipo permitisse, 
      // mas vamos fazer a logica de remove/update baseada na mesma condicao do find.
      
      return [...prev, newItem];
    });
    setIsSidebarOpen(true);
  };

  // Helper para identificar item único
  const getCartItemId = (item: CartItem) => item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : `${item.id}-default`;

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

  const totalPrice = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Helper para formatar moeda PT-BR
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const checkoutWhatsApp = async () => {
    const settings = await api.getSettings();
    const phone = settings.whatsapp_number.replace(/\D/g, '');
    
    let message = `*Novo Pedido - ${settings.store_name}*\n\n`;
    message += `------------------------------\n`;

    items.forEach(item => {
      // Nome do item com o tamanho específico se houver variante
      const itemName = item.selectedVariant 
        ? `${item.name} (${item.selectedVariant.name})`
        : item.name;

      message += `*${item.quantity}x ${itemName}*\n`;
      
      // Se for produto simples e tiver size definido (ex: Unidade, 500ml) e não for variante
      if(!item.selectedVariant && item.size) {
          message += `   (Tamanho: ${item.size})\n`;
      }
      
      message += `   Unitário: ${formatPrice(item.price)}\n`;
      message += `   Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    message += `------------------------------\n`;
    message += `*Valor Total: ${formatPrice(totalPrice)}*\n`;
    message += `------------------------------\n\n`;
    
    message += `Taxa de entrega: A calcular\n`;
    message += `Horário de entrega: A combinar\n\n`;
    message += `Aguardo confirmação!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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