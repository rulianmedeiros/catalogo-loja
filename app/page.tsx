"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Lock, Search, X, ChevronRight } from 'lucide-react';
import { CartProvider, useCart } from './contexts/CartContext';
import { CartSidebar } from './components/CartSidebar';
import { ProductModal } from './components/ProductModal';
import { AdminPanel } from './components/AdminPanel';
import { api } from './services/dataService';
import { Category, Product, StoreSettings } from './types';

// --- MODAL DE LOGIN ADMIN ---
const LoginModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: (password: string) => void;
  settings: StoreSettings;
}> = ({ isOpen, onClose, onLogin, settings }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" style={{ color: settings.primary_color }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Área Administrativa</h2>
          <p className="text-sm text-gray-500">Digite a senha para acessar</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(password); }} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent outline-none transition"
            style={{ '--tw-ring-color': settings.primary_color } as React.CSSProperties}
            autoFocus
          />
          <button 
            type="submit"
            className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: settings.primary_color }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE DO CARD DE PRODUTO ---
const ProductCard: React.FC<{ 
    product: Product, 
    settings: StoreSettings,
    onClick: () => void 
}> = ({ product, settings, onClick }) => {
  const formattedPrice = Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div 
      className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col h-full border border-gray-100 hover:border-gray-200"
      onClick={onClick}
    >
      <div className="h-64 md:h-72 overflow-hidden bg-gray-100 relative">
        <img 
          src={product.image_url || "https://via.placeholder.com/300"} 
          alt={product.name} 
          className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-full p-3 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
           <ShoppingBag className="w-5 h-5" style={{ color: settings.primary_color }} />
        </div>
        {product.size && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {product.size}
            </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 leading-tight line-clamp-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed h-10">{product.description}</p>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-extrabold" style={{ color: settings.primary_color }}>
                {formattedPrice}
              </span>
          </div>
          
          <button 
            className="w-full text-white font-bold text-sm md:text-base py-3 rounded-xl hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
            style={{ backgroundColor: settings.primary_color }}
          >
            Adicionar
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DO CATÁLOGO (ÁREA PÚBLICA) ---
const Catalog: React.FC<{ 
  settings: StoreSettings, 
  categories: Category[], 
  products: Product[],
  onAdminRequest: () => void 
}> = ({ settings, categories, products, onAdminRequest }) => {
  const { toggleSidebar, totalItems } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => String(p.category_id) === String(activeCategory));

  const renderProductList = () => {
    // 1. Visão de Categoria Única (Grade/Grid)
    if (activeCategory !== 'all') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 md:px-8 pb-20 max-w-[1600px] mx-auto">
          {filteredProducts.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                settings={settings}
                onClick={() => setSelectedProduct(product)} 
            />
          ))}
          {filteredProducts.length === 0 && (
             <div className="col-span-full text-center py-20 text-gray-400">
                Nenhum produto encontrado nesta categoria.
             </div>
          )}
        </div>
      );
    }

    // 2. Visão Geral (Carrossel Horizontal por Categoria)
    return (
        <div className="space-y-12 pb-20 max-w-[1600px] mx-auto">
            {categories.map(cat => {
                const catProducts = products.filter(p => String(p.category_id) === String(cat.id));
                if (catProducts.length === 0) return null;
                
                return (
                    <div key={cat.id} className="flex flex-col">
                        <div className="px-4 md:px-8 flex items-center gap-4 mb-6">
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{cat.name}</h3>
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <button 
                            onClick={() => setActiveCategory(cat.id)}
                            className="text-sm font-bold flex items-center gap-1 hover:underline"
                            style={{ color: settings.primary_color }}
                          >
                            Ver todos <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Carrossel de Produtos */}
                        <div className="
                            flex 
                            overflow-x-auto 
                            pb-8 
                            pt-2 
                            px-4 
                            md:px-8 
                            gap-4 
                            snap-x 
                            snap-mandatory 
                            [&::-webkit-scrollbar]:hidden 
                            [-ms-overflow-style:'none'] 
                            [scrollbar-width:'none']
                        ">
                            {catProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className="snap-center shrink-0 w-[85vw] sm:w-[300px]"
                                >
                                    <ProductCard 
                                        product={product} 
                                        settings={settings}
                                        onClick={() => setSelectedProduct(product)} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-full shadow-sm object-contain" />}
             <span className="font-extrabold text-2xl tracking-tight text-gray-900">{settings.store_name}</span>
          </div>
          
          <button 
            onClick={toggleSidebar}
            className="relative p-3 hover:bg-gray-100 rounded-full transition group"
          >
            <ShoppingBag className="w-7 h-7" style={{ color: settings.primary_color }} />
            {totalItems > 0 && (
              <span 
                className="absolute top-1 right-1 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: settings.primary_color }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner Principal */}
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
         <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden shadow-lg group">
            {settings.banner_link ? (
               <a href={settings.banner_link} className="block w-full h-full cursor-pointer">
                  <img 
                    src={settings.banner_url || "https://images.unsplash.com/photo-1557308536-ee471ef2c39a"} 
                    alt="Banner" 
                    className="w-full h-full object-cover transition duration-1000 group-hover:scale-105" 
                  />
               </a>
            ) : (
                <img 
                  src={settings.banner_url || "https://images.unsplash.com/photo-1557308536-ee471ef2c39a"} 
                  alt="Banner" 
                  className="w-full h-full object-cover transition duration-1000 group-hover:scale-105" 
                />
            )}
         </div>
      </div>

      {/* Categorias (Carrossel de Bolinhas Grandes) */}
      <div className="w-full mb-8">
        <div className="
            flex 
            overflow-x-auto 
            gap-6 
            px-4 
            py-6
            md:justify-center 
            md:gap-10
            snap-x
            [&::-webkit-scrollbar]:hidden 
            [-ms-overflow-style:'none'] 
            [scrollbar-width:'none']
        ">
          <div 
             onClick={() => setActiveCategory('all')}
             className="flex flex-col items-center gap-3 cursor-pointer group shrink-0 snap-start"
          >
             <div 
                className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] p-1.5 transition-all duration-300 hover:scale-105`}
                style={{ borderColor: activeCategory === 'all' ? settings.primary_color : 'transparent' }}
             >
               <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition shadow-inner">
                  <span className="text-xs md:text-sm font-bold tracking-widest text-gray-700">TODOS</span>
               </div>
             </div>
             <span 
                className="text-sm md:text-lg font-semibold transition"
                style={{ color: activeCategory === 'all' ? settings.primary_color : '#6b7280' }}
             >
                Tudo
             </span>
          </div>
          
          {categories.map(cat => (
             <div 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-3 cursor-pointer group shrink-0 snap-start"
             >
                <div 
                   className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] p-1.5 transition-all duration-300 hover:scale-105`}
                   style={{ borderColor: activeCategory === cat.id ? settings.primary_color : 'transparent' }}
                >
                  <img src={cat.image_url || "https://via.placeholder.com/150"} alt={cat.name} className="w-full h-full rounded-full object-cover shadow-sm" />
                </div>
                <span 
                   className="text-sm md:text-lg font-semibold transition"
                   style={{ color: activeCategory === cat.id ? settings.primary_color : '#6b7280' }}
                >
                   {cat.name}
                </span>
             </div>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="flex-1 w-full">
         {renderProductList()}
      </div>

      {/* Rodapé (Área de Login Admin escondida) */}
      <footer className="border-t py-12 bg-white text-center mt-auto">
         <div onClick={onAdminRequest} className="inline-block cursor-default select-none">
             <p className="text-gray-500 mb-4 font-medium hover:text-gray-600 transition-colors">
                 &copy; {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.
             </p>
         </div>
      </footer>

      <CartSidebar />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

// --- APP PRINCIPAL ---
const App: React.FC = () => {
  const [view, setView] = useState<'catalog' | 'admin'>('catalog');
  const [data, setData] = useState<{settings: StoreSettings, categories: Category[], products: Product[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
     const fetchData = async () => {
        try {
            const settings = await api.getSettings();
            // Garante cores padrão caso não existam no banco
            if (!settings.primary_color) settings.primary_color = '#000000';
            if (!settings.secondary_color) settings.secondary_color = '#333333';

            const categories = await api.getCategories();
            const products = await api.getProducts();
            setData({ settings, categories, products });
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
     };
     fetchData();
  }, [view]);

  const handleLogin = (password: string) => {
    if (data?.settings.admin_password_hash && password === data.settings.admin_password_hash) {
        setView('admin');
        setIsLoginModalOpen(false);
    } else {
        alert("Senha incorreta.");
    }
  };

  if (loading || !data) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
  }

  if (view === 'admin') {
     return <AdminPanel onLogout={() => setView('catalog')} />;
  }

  return (
    <CartProvider>
      <Catalog 
        settings={data.settings} 
        categories={data.categories} 
        products={data.products}
        onAdminRequest={() => setIsLoginModalOpen(true)}
      />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        settings={data.settings}
      />
    </CartProvider>
  );
};

export default App;