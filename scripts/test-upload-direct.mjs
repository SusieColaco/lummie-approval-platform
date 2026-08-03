#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=')
    env[key.trim()] = value.trim()
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testUploadDirect() {
  console.log('\n🚀 TESTE DIRETO DE UPLOAD\n')

  try {
    console.log('📤 Tentando upload direto...')

    const testContent = Buffer.from('%PDF-1.4\nTest file for validation\n')
    const testPath = `validation/test-${Date.now()}.pdf`

    const { data, error } = await supabase.storage
      .from('lummie-files')
      .upload(testPath, testContent, {
        upsert: true,
        contentType: 'application/pdf'
      })

    if (error) {
      console.log(`❌ Erro no upload: ${error.message}`)
      console.log(`   Status: ${error.status}`)
      console.log(`   Code: ${error.code}`)
      return
    }

    console.log(`✅ Upload bem-sucedido!`)
    console.log(`   Path: ${data.path}`)

    // Try to get the file URL
    const { data: urlData } = supabase.storage
      .from('lummie-files')
      .getPublicUrl(data.path)

    console.log(`   URL: ${urlData.publicUrl}`)

    // Clean up
    console.log('\n🧹 Limpando arquivo de teste...')
    const { error: deleteError } = await supabase.storage
      .from('lummie-files')
      .remove([testPath])

    if (deleteError) {
      console.log(`⚠️ Erro ao deletar: ${deleteError.message}`)
    } else {
      console.log('✅ Arquivo removido')
    }

    console.log('\n✅ TESTE COMPLETO - TUDO FUNCIONANDO!\n')

  } catch (err) {
    console.error('💥 Erro inesperado:', err.message)
  }
}

testUploadDirect()
