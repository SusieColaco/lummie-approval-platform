import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', Number(params.id))
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar projeto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, client_name, client_email } = body

    const { data, error } = await supabase
      .from('projects')
      .update({
        name,
        client_name,
        client_email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', Number(params.id))
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar projeto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', Number(params.id))

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Projeto deletado' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar projeto' },
      { status: 500 }
    )
  }
}
