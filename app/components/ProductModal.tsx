"use client";
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../types';
import { X, ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  // State for Swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Combine main image and gallery into one array
  const allImages = product 
    ? [product.image_url, ...(product.gallery || [])].filter(Boolean)
    : [];

  // Reset states when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    if (product && product.variants && product.variants.length > 0) {
        // Select first variant by default
        setSelectedVariant(product.variants[0]);
    } else {
        setSelectedVariant(null);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    // If variants exist, selectedVariant must be defined (default logic handles this)
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
        alert("Por favor, selecione um tamanho.");
        return;
    }
    
    // Pass selectedVariant (can be null for simple products)
    addToCart(product, selectedVariant || undefined);
    onClose();
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // Dynamic Price and Description based on Variant Selection
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayDescription = (selectedVariant && selectedVariant.description) 
    ? selectedVariant.description 
    : product.description;
  const displaySize = (selectedVariant ? selectedVariant.name : product.size) || 'Único';

  const formattedPrice = Number(displayPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[85vh] animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition shadow-md group"
        >
          <X className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform" />
        </button>

        {/* Image Section - Interactive Carousel */}
        <div 
            className="w-full md:w-1/2 bg-gray-100 h-1/2 md:h-auto relative group select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {allImages.length > 0 ? (
                <img 
                 src={allImages[currentImageIndex]} 
                 alt={`${product.name} - View ${currentImageIndex + 1}`} 
                 className="w-full h-full object-cover transition-opacity duration-300"
                 draggable={false}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
            )}

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm transition opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm transition opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Gallery Indicators */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 p-2">
                 {allImages.map((_, i) => (
                     <button
                         key={i}
                         onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                         className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                             i === currentImageIndex 
                             ? 'bg-white scale-125 w-4' 
                             : 'bg-white/50 hover:bg-white/80'
                         }`}
                         aria-label={`Ver imagem ${i + 1}`}
                     />
                 ))}
              </div>
            )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col h-1/2 md:h-auto bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
              <div className="mb-4">
                 <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg">
                    {displaySize}
                 </span>
              </div>
              
              <h2 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-2 md:mb-4 leading-tight">{product.name}</h2>
              
              <div className="flex items-center gap-4 mb-4 md:mb-8">
                 {/* CORREÇÃO: Preço em Cinza Escuro/Preto para legibilidade */}
                 <p className="text-2xl md:text-4xl font-bold text-gray-900">{formattedPrice}</p>
              </div>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Escolha o Tamanho</label>
                      <div className="flex flex-wrap gap-3">
                          {product.variants.map(variant => {
                              const isSelected = selectedVariant?.id === variant.id;
                              return (
                                  <button
                                      key={variant.id}
                                      onClick={() => setSelectedVariant(variant)}
                                      // CORREÇÃO: Cores manuais para o seletor também (verde)
                                      className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition flex items-center gap-2 ${
                                          isSelected 
                                          ? 'border-green-600 bg-green-50 text-green-700' 
                                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                      }`}
                                  >
                                      {variant.name}
                                      {isSelected && <Check className="w-4 h-4" />}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              )}
              
              <div className="prose prose-sm md:prose-lg text-gray-600 mb-8 leading-relaxed">
                <p>{displayDescription || 'Sem descrição disponível.'}</p>
              </div>
            </div>

            <div className="pt-4 md:pt-6 mt-auto border-t border-gray-100">
              {/* CORREÇÃO: Botão Verde Forte (bg-green-600) e Texto Branco */}
              <button 
                onClick={handleAdd}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
              >
                <ShoppingBag className="w-6 h-6" />
                Adicionar {selectedVariant ? `(${selectedVariant.name})` : ''} à Sacola
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};