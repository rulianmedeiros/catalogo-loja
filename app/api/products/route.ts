import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Rota para BUSCAR produtos (GET)
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Rota para CRIAR produtos (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar dados' }, { status: 500 });
  }
}