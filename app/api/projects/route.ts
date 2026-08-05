import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao listar projetos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, client_name, client_email } = body

    if (!name || !client_name || !client_email) {
      return NextResponse.json(
        { error: 'Nome, cliente e email são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        client_name,
        client_email,
        status: 'Em andamento',
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar projeto' },
      { status: 500 }
    )
  }
}
