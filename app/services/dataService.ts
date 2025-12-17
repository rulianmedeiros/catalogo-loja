import { supabase } from '@/lib/supabase';
import { Category, Product, StoreSettings } from '../types';

export const api = {
  // --- CONFIGURAÇÕES DA LOJA (BLINDADO PARA ID 1) ---

  getSettings: async (): Promise<StoreSettings> => {
    // Busca a configuração Mestra (ID 1)
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Se não encontrar (banco vazio), retorna um padrão para o site não travar
      return {
        id: '1',
        store_name: 'Minha Loja',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        whatsapp_number: '',
        admin_password_hash: 'admin123'
      } as any; // Cast simples para evitar erros de tipagem estritos
    }

    return data;
  },

  updateSettings: async (settings: Partial<StoreSettings>) => {
    // AQUI ESTÁ O TRUQUE: Forçamos o ID ser 1 sempre.
    // Assim, não importa o que aconteça, ele atualiza a linha mestra.
    const dadosParaSalvar = {
      ...settings,
      id: 1 
    };

    // Upsert: Se existe atualiza, se não existe cria.
    const { data, error } = await supabase
      .from('store_settings')
      .upsert(dadosParaSalvar)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
    return data;
  },

  // --- CATEGORIAS ---

  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true }); // Ordena para não ficar pulando

    if (error) throw error;
    return data || [];
  },

  createCategory: async (category: Omit<Category, 'id'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateCategory: async (id: string | number, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  deleteCategory: async (id: string | number) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- PRODUTOS ---

  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  createProduct: async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProduct: async (id: string | number, updates: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  deleteProduct: async (id: string | number) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};