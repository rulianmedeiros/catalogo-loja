"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../services/dataService';
import { Category, Product, StoreSettings, ProductVariant } from '../types';
import { Save, LogOut, Package, Layers, Settings as SettingsIcon, Plus, Trash2, Edit2, Image as ImageIcon, X, ArrowLeft, Lock, Upload, Scale, Loader2, Link as LinkIcon } from 'lucide-react';

// Função auxiliar para converter arquivo em Base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Componente reutilizável de Input de Imagem
const ImageUploadField = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Cole a URL ou faça upload...", 
  previewHeight = "h-40" 
}: { 
  label?: string, 
  value: string | undefined, 
  onChange: (val: string) => void, 
  placeholder?: string,
  previewHeight?: string
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (file.size > 4 * 1024 * 1024) {
             alert('A imagem é muito grande! Tente uma menor que 4MB.');
             return;
        }
        const base64 = await convertFileToBase64(file);
        onChange(base64);
      } catch (err) {
        alert('Erro ao processar imagem.');
      }
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
      <div className="flex gap-2">
        <div className="flex-1 relative">
           <input 
             type="text" 
             value={value || ''} 
             onChange={(e) => onChange(e.target.value)}
             className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none transition text-sm"
             placeholder={placeholder}
           />
           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
             <ImageIcon className="w-4 h-4" />
           </div>
        </div>
        <label className="bg-gray-800 hover:bg-black text-white px-4 py-2.5 rounded-lg cursor-pointer transition flex items-center gap-2 font-medium shadow-sm min-w-fit">
           <Upload className="w-4 h-4" />
           <span className="hidden sm:inline text-sm">Upload</span>
           <input 
             type="file" 
             accept="image/png, image/jpeg, image/jpg, image/webp" 
             className="hidden" 
             onChange={handleFileChange} 
           />
        </label>
      </div>
      
      {value && (
         <div className={`mt-3 ${previewHeight} w-full rounded-lg bg-gray-50 border border-gray-200 overflow-hidden relative group`}>
            <img src={value} className="w-full h-full object-contain" alt="Preview" />
            <button 
              onClick={() => onChange('')}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
              type="button"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
         </div>
      )}
    </div>
  );
};

export const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'products'>('settings');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit States
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  
  // Variant form state
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({ name: '', price: 0, description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setSettings(await api.getSettings());
    setProducts(await api.getProducts());
    setCategories(await api.getCategories());
  };

  /* --- Settings Handlers --- */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if(settings) {
        setIsSaving(true);
        try {
            await api.updateSettings(settings);
            
            // Atualiza cores visualmente na hora
            if (settings.primary_color) {
                document.documentElement.style.setProperty('--color-primary', settings.primary_color);
            }
            if (settings.secondary_color) {
                document.documentElement.style.setProperty('--color-secondary', settings.secondary_color);
            }
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar. Verifique se a imagem não é muito pesada.');
        } finally {
            setIsSaving(false);
        }
    }
  };

  /* --- Category Handlers --- */
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    setIsSaving(true);
    try {
        if (editingCategory.id) {
            await api.updateCategory(editingCategory.id, editingCategory);
        } else {
            await api.createCategory(editingCategory as any);
        }
        setEditingCategory(null);
        await loadData();
    } catch (error) {
        alert('Erro ao salvar categoria.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza? Isso pode ocultar produtos desta categoria.')) {
        await api.deleteCategory(id);
        loadData();
    }
  };

  /* --- Product Handlers --- */
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;
    
    const hasVariants = editingProduct.variants && editingProduct.variants.length > 0;
    if (!hasVariants && (!editingProduct.price || editingProduct.price <= 0)) {
        alert("Adicione um preço ou pelo menos uma variação de tamanho.");
        return;
    }

    setIsSaving(true);
    try {
        const payload = { ...editingProduct };
        // Garante preço válido para ordenação
        if (hasVariants && editingProduct.variants) {
             payload.price = editingProduct.variants[0].price;
             payload.size = editingProduct.variants[0].name;
        }

        if (editingProduct.id) {
            await api.updateProduct(editingProduct.id, payload);
        } else {
            await api.createProduct(payload as any);
        }
        setEditingProduct(null);
        await loadData();
    } catch (error) {
        alert('Erro ao salvar produto.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
      if (confirm('Tem certeza que deseja excluir este produto?')) {
          await api.deleteProduct(id);
          loadData();
      }
  };

  /* --- Gallery Handlers --- */
  const handleAddGalleryImage = () => {
      if (editingProduct) {
          const currentGallery = editingProduct.gallery || [];
          setEditingProduct({ ...editingProduct, gallery: [...currentGallery, ''] });
      }
  };

  const handleUpdateGalleryImage = (index: number, value: string) => {
      if (editingProduct && editingProduct.gallery) {
          const newGallery = [...editingProduct.gallery];
          newGallery[index] = value;
          setEditingProduct({ ...editingProduct, gallery: newGallery });
      }
  };

  const handleRemoveGalleryImage = (index: number) => {
      if (editingProduct && editingProduct.gallery) {
          const newGallery = editingProduct.gallery.filter((_, i) => i !== index);
          setEditingProduct({ ...editingProduct, gallery: newGallery });
      }
  };

  /* --- Variant Handlers --- */
  const handleAddVariant = () => {
      if (!newVariant.name || !newVariant.price) {
          alert("Nome e Preço são obrigatórios para a variação.");
          return;
      }
      const variant: ProductVariant = {
          id: Math.random().toString(36).substr(2, 9),
          name: newVariant.name,
          price: Number(newVariant.price),
          description: newVariant.description || ''
      };

      const currentVariants = editingProduct?.variants || [];
      setEditingProduct({ ...editingProduct, variants: [...currentVariants, variant] });
      setNewVariant({ name: '', price: 0, description: '' }); 
  };

  const handleRemoveVariant = (id: string) => {
      if (editingProduct?.variants) {
          setEditingProduct({
              ...editingProduct,
              variants: editingProduct.variants.filter(v => v.id !== id)
          });
      }
  };


  if (!settings) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400"/></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-900">
      {/* Sidebar Nav */}
      <aside className="bg-white w-full md:w-64 border-r p-6 flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-2 mb-8 text-gray-900">
            <SettingsIcon className="w-8 h-8" />
            <h2 className="text-xl font-bold tracking-tight">Admin</h2>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => { setActiveTab('settings'); setEditingProduct(null); setEditingCategory(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'settings' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <SettingsIcon className="w-5 h-5" /> Configurações
          </button>
          <button 
            onClick={() => { setActiveTab('categories'); setEditingProduct(null); setEditingCategory(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'categories' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Layers className="w-5 h-5" /> Categorias
          </button>
          <button 
            onClick={() => { setActiveTab('products'); setEditingProduct(null); setEditingCategory(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === 'products' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" /> Produtos
          </button>
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-600 mt-auto pt-6 border-t font-medium hover:text-red-700 transition">
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[#f8f9fa]">
        
        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Aparência e Dados</h3>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Seção de Cores */}
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🎨 Personalização de Cores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cor Principal (Botões/Destaques)</label>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border">
                                <input 
                                type="color" 
                                value={settings.primary_color || '#000000'}
                                onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                                className="h-10 w-16 rounded cursor-pointer border-none p-0"
                                />
                                <span className="text-gray-600 text-sm font-mono uppercase">{settings.primary_color}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cor Secundária (Efeito Hover)</label>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border">
                                <input 
                                type="color" 
                                value={settings.secondary_color || '#333333'}
                                onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                                className="h-10 w-16 rounded cursor-pointer border-none p-0"
                                />
                                <span className="text-gray-600 text-sm font-mono uppercase">{settings.secondary_color}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Loja</label>
                        <input 
                        type="text" 
                        value={settings.store_name}
                        onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp (só números)</label>
                        <input 
                        type="text" 
                        value={settings.whatsapp_number}
                        onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none transition"
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Lock className="w-4 h-4" /> Senha de Acesso Admin
                    </label>
                    <input 
                        type="text" 
                        value={settings.admin_password_hash}
                        onChange={(e) => setSettings({...settings, admin_password_hash: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none transition bg-white"
                        placeholder="Digite a nova senha..."
                    />
                </div>

                <div className="space-y-6 border-t pt-6">
                    <ImageUploadField 
                    label="Logo da Loja" 
                    value={settings.logo_url} 
                    onChange={(val) => setSettings({...settings, logo_url: val})}
                    previewHeight="h-24"
                    />

                    <div>
                        <ImageUploadField 
                        label="Banner Principal" 
                        value={settings.banner_url} 
                        onChange={(val) => setSettings({...settings, banner_url: val})}
                        previewHeight="h-40"
                        />
                         {/* CAMPO NOVO: Link do Banner */}
                        <div className="mt-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Link do Banner (Opcional)</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={settings.banner_link || ''}
                                    onChange={(e) => setSettings({...settings, banner_link: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none transition text-sm"
                                    placeholder="Ex: https://google.com ou #promocoes"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Use <b>#nome-da-categoria</b> para rolar até uma seção, ou cole um link completo.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t sticky bottom-0 bg-white p-4 -mx-4 -mb-4 md:static md:p-0 md:mx-0 md:mb-0">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
                </form>
            </div>
          </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             {editingCategory ? (
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">{editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                        <button onClick={() => setEditingCategory(null)} className="text-gray-500 hover:text-gray-800"><X /></button>
                    </div>
                    <form onSubmit={handleSaveCategory} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome</label>
                            <input 
                                className="w-full p-2 border rounded-lg focus:ring-gray-800" 
                                value={editingCategory.name || ''} 
                                onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                                required
                            />
                        </div>
                        
                        <ImageUploadField 
                          label="Imagem da Categoria (Ícone)"
                          value={editingCategory.image_url}
                          onChange={(val) => setEditingCategory({...editingCategory, image_url: val})}
                          previewHeight="h-32"
                        />

                        <div className="flex gap-2 justify-end pt-4">
                            <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black disabled:opacity-50">
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                 </div>
             ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Categorias</h3>
                        <button 
                            onClick={() => setEditingCategory({})}
                            className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 hover:bg-black transition"
                        >
                            <Plus className="w-4 h-4" /> Nova Categoria
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <img src={cat.image_url} className="w-14 h-14 rounded-full object-cover bg-gray-100 border-2 border-white shadow-sm" />
                                    <span className="font-bold text-gray-800">{cat.name}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
             )}
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
           <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             {editingProduct ? (
                 <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                     <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setEditingProduct(null)} className="mr-2 p-1 hover:bg-gray-200 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                             <h3 className="text-xl font-bold">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                        </div>
                        <button onClick={() => setEditingProduct(null)} className="text-gray-500"><X /></button>
                     </div>
                     
                     <form onSubmit={handleSaveProduct} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                                <input 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 outline-none" 
                                    value={editingProduct.name || ''} 
                                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                                <select 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 outline-none bg-white"
                                    value={editingProduct.category_id || ''}
                                    onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Padrão</label>
                                <textarea 
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 outline-none" 
                                    value={editingProduct.description || ''} 
                                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                                    placeholder="Descrição geral do produto"
                                />
                            </div>

                            {/* --- VARIANTS / SIZES SECTION --- */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Scale className="w-5 h-5 text-gray-600" />
                                    <h4 className="font-bold text-gray-800">Opções de Tamanho/Variação</h4>
                                </div>
                                
                                <div className="space-y-3 mb-4">
                                    {(editingProduct.variants || []).map((variant, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border shadow-sm flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">{variant.name}</span>
                                                    <span className="text-green-600 font-medium">R$ {variant.price.toFixed(2)}</span>
                                                </div>
                                                {variant.description && <p className="text-xs text-gray-500 mt-1">{variant.description}</p>}
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveVariant(variant.id)}
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(editingProduct.variants || []).length === 0 && (
                                        <p className="text-sm text-gray-400 italic">Nenhuma variação adicionada. O produto usará o preço/tamanho único abaixo.</p>
                                    )}
                                </div>

                                {/* Add new variant form */}
                                <div className="grid grid-cols-1 gap-3 border-t pt-3 border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Adicionar Nova Variação</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            placeholder="Nome (Ex: 1kg, G)" 
                                            className="px-3 py-2 border rounded-md text-sm"
                                            value={newVariant.name}
                                            onChange={e => setNewVariant({...newVariant, name: e.target.value})}
                                        />
                                        <input 
                                            type="number" step="0.01"
                                            placeholder="Preço (R$)" 
                                            className="px-3 py-2 border rounded-md text-sm"
                                            value={newVariant.price || ''}
                                            onChange={e => setNewVariant({...newVariant, price: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <input 
                                        placeholder="Descrição específica (Opcional)" 
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                        value={newVariant.description}
                                        onChange={e => setNewVariant({...newVariant, description: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddVariant}
                                        className="w-full bg-gray-800 text-white py-2 rounded-md text-sm font-bold hover:bg-gray-700 transition"
                                    >
                                        + Adicionar Opção
                                    </button>
                                </div>
                            </div>
                            
                            {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                                <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <div className="col-span-2 text-xs text-yellow-700 font-medium mb-1">
                                        *Preencha abaixo apenas se não houver variações acima.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Preço Único</label>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 outline-none bg-white" 
                                            value={editingProduct.price || ''} 
                                            onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho Único</label>
                                        <input 
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 outline-none bg-white" 
                                            value={editingProduct.size || ''} 
                                            onChange={e => setEditingProduct({...editingProduct, size: e.target.value})}
                                            placeholder="Ex: Único"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                             <ImageUploadField 
                                label="Imagem Principal"
                                value={editingProduct.image_url}
                                onChange={(val) => setEditingProduct({...editingProduct, image_url: val})}
                                previewHeight="h-48"
                             />

                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700">Galeria de Fotos</label>
                                    <button type="button" onClick={handleAddGalleryImage} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-medium">+ Adicionar Slot</button>
                                </div>
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    {/* AQUI ESTAVA O ERRO: Agora incluímos o ImageUploadField dentro do loop */}
                                    {(editingProduct.gallery || []).map((url, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">Imagem {idx + 1}</span>
                                                <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                            {/* O Campo de Input voltou! */}
                                            <ImageUploadField 
                                                value={url}
                                                onChange={(val) => handleUpdateGalleryImage(idx, val)}
                                                previewHeight="h-24"
                                                placeholder="Upload ou URL..."
                                            />
                                        </div>
                                    ))}
                                    {(editingProduct.gallery || []).length === 0 && (
                                        <p className="text-sm text-gray-400 italic text-center py-4">Nenhuma foto extra adicionada.</p>
                                    )}
                                </div>
                             </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-6 border-t flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition disabled:opacity-50">
                                {isSaving ? 'Salvando...' : 'Salvar Produto'}
                            </button>
                        </div>
                     </form>
                 </div>
             ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Produtos ({products.length})</h3>
                        <button 
                            onClick={() => setEditingProduct({ gallery: [], variants: [] })}
                            className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 hover:bg-black transition"
                        >
                            <Plus className="w-4 h-4" /> Novo Produto
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Imagem</th>
                                    <th className="p-4 font-medium">Produto</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Categoria</th>
                                    <th className="p-4 font-medium">Variações</th>
                                    <th className="p-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.map(p => {
                                    const hasVariants = p.variants && p.variants.length > 0;
                                    const displayPrice = hasVariants 
                                        ? `A partir de R$ ${p.variants![0].price.toFixed(2)}`
                                        : `R$ ${p.price.toFixed(2)}`;
                                    
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 w-20">
                                                <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover bg-gray-200 border" />
                                            </td>
                                            <td className="p-4 font-medium text-gray-900">{p.name}</td>
                                            <td className="p-4 text-gray-500 hidden md:table-cell">
                                                {categories.find(c => c.id === p.category_id)?.name || 'N/A'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {hasVariants ? (
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                                        {p.variants?.length} opções
                                                    </span>
                                                ) : (
                                                    <span>{displayPrice}</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
             )}
          </div>
        )}
      </main>
    </div>
  );
};