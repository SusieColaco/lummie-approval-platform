import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://dpaxhawnapjzzpvwvstq.supabase.co'
const supabaseAnonKey = 'sb_publishable_7Slns0QK-VuWv2sw9K6fuw_ViR3RTK0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...\n')

  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão...')
    const { data: tableData, error: tableError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1)

    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError)
      return
    }
    console.log('✅ Conexão OK')
    console.log(`   Projetos encontrados: ${tableData?.length || 0}\n`)

    // 2. Testar upload
    console.log('2️⃣ Testando upload de arquivo...')
    const testFile = '/private/tmp/claude-501/-Users-susiecolaco/a2556c51-c0a7-46a9-9959-28d4f8b84858/scratchpad/test.pdf'

    if (!fs.existsSync(testFile)) {
      console.error('❌ Arquivo de teste não encontrado')
      return
    }

    const fileContent = fs.readFileSync(testFile)
    const fileName = `1/brand_book/${Date.now()}-test.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lummie-files')
      .upload(fileName, fileContent, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError)
      return
    }

    console.log('✅ Upload OK')
    console.log(`   Path: ${uploadData.path}\n`)

    // 3. Testar salvar referência
    console.log('3️⃣ Testando salvar referência no banco...')
    const { data: refData, error: refError } = await supabase
      .from('files')
      .upsert({
        project_id: 1,
        type: 'brand_book',
        file_path: uploadData.path,
        name: 'test.pdf',
        file_size: fileContent.length,
        uploaded_by: 'test@lummie.com',
      })
      .select()

    if (refError) {
      console.error('❌ Erro ao salvar referência:', refError)
      return
    }

    console.log('✅ Referência salva OK')
    console.log(`   Dados: ${JSON.stringify(refData, null, 2)}\n`)

    // 4. Testar leitura
    console.log('4️⃣ Testando leitura de arquivos do projeto...')
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', 1)

    if (filesError) {
      console.error('❌ Erro ao ler arquivos:', filesError)
      return
    }

    console.log('✅ Leitura OK')
    console.log(`   Arquivos encontrados: ${filesData?.length || 0}`)
    filesData?.forEach(f => {
      console.log(`   - ${f.type}: ${f.name} (${(f.file_size / 1024).toFixed(2)} KB)`)
    })

    console.log('\n✅ Todos os testes passaram!')

  } catch (error) {
    console.error('💥 Erro:', error)
  }
}

testSupabase()
