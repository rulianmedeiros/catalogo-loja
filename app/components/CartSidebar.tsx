"use client";import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartSidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, items, updateQuantity, removeFromCart, totalPrice, checkoutWhatsApp, formatPrice } = useCart();

  // Helper para gerar ID único na view
  const getCartItemId = (item: any) => item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : `${item.id}-default`;

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Sua Sacola</h2>
          </div>
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Sua sacola está vazia.</p>
              <button 
                onClick={toggleSidebar}
                className="text-primary font-medium hover:underline"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
                const uniqueId = getCartItemId(item);
                return (
                  <div key={uniqueId} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name} 
                      className="w-20 h-20 object-cover rounded-lg bg-white"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 line-clamp-1">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">
                            {item.variant ? item.variant.name : 'Único'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-medium text-gray-900">{formatPrice(item.product.price)}</p>
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
                          <button 
                            onClick={() => item.quantity > 1 ? updateQuantity(uniqueId, -1) : removeFromCart(uniqueId)}
                            className="p-1 hover:text-red-500 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-4 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(uniqueId, 1)}
                            className="p-1 hover:text-green-500 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50 safe-area-pb">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
            <button 
              onClick={checkoutWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>Finalizar no WhatsApp</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};