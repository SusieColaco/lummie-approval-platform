import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('project_id', Number(params.id))

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Todos os roteiros foram deletados' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar roteiros' },
      { status: 500 }
    )
  }
}
