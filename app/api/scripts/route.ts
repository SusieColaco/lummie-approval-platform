import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('client_id')

    if (clientId) {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('client_id', Number(clientId))
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Listar todas (sem filtro)
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar roteiros' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, demand_id, title, content, status } = body

    if (!client_id || !title) {
      return NextResponse.json(
        { error: 'client_id e title são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        client_id,
        demand_id: demand_id || null,
        title,
        content: content || '',
        status: status || 'Aguardando aprovação',
      })
      .select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar roteiro' },
      { status: 500 }
    )
  }
}
