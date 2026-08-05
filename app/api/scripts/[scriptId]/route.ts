import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', Number(params.scriptId))
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar script' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const body = await request.json()
    const { title, content, status, demand_id } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (status !== undefined) updateData.status = status
    if (demand_id !== undefined) updateData.demand_id = demand_id

    const { data, error } = await supabase
      .from('scripts')
      .update(updateData)
      .eq('id', Number(params.scriptId))
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar script' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', Number(params.scriptId))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar script' },
      { status: 500 }
    )
  }
}
