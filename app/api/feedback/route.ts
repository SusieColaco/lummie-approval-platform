import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const scriptId = request.nextUrl.searchParams.get('script_id')

    if (!scriptId) {
      return NextResponse.json({ error: 'script_id é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('script_id', Number(scriptId))
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar feedback' },
      { status: 500 }
    )
  }
}
