import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (token) {
      // Buscar por token (para acesso do cliente)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('token', token)

      if (error) throw error
      return NextResponse.json(data)
    }

    // Listar todos (para admin)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao listar clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, project_type } = body

    if (!name || !email || !project_type) {
      return NextResponse.json(
        { error: 'Nome, email e tipo de projeto são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar token único
    const token = crypto.randomBytes(16).toString('hex')

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        project_type,
        token,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}
