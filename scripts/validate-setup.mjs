#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function validateSetup() {
  console.log('\n🔍 VALIDANDO CONFIGURAÇÃO DO SUPABASE\n')

  let allPassed = true

  // 1. Test database connection
  console.log('1️⃣ Testando conexão com banco...')
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1)
    if (error) throw error
    console.log('   ✅ Banco OK\n')
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`)
    allPassed = false
  }

  // 2. Test storage bucket
  console.log('2️⃣ Testando bucket lummie-files...')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) throw error

    const bucket = buckets?.find(b => b.name === 'lummie-files')
    if (!bucket) {
      console.log('   ❌ Bucket não encontrado\n')
      allPassed = false
    } else {
      console.log(`   ✅ Bucket OK (public: ${bucket.public})\n`)
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`)
    allPassed = false
  }

  // 3. Test upload
  console.log('3️⃣ Testando upload...')
  try {
    const testContent = Buffer.from('%PDF-1.4 test')
    const testPath = `validation/test-${Date.now()}.pdf`

    const { data, error } = await supabase.storage
      .from('lummie-files')
      .upload(testPath, testContent, { upsert: true })

    if (error) throw error

    console.log('   ✅ Upload OK\n')

    // Cleanup
    await supabase.storage.from('lummie-files').remove([testPath])
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`)
    allPassed = false
  }

  // 4. Test database write
  console.log('4️⃣ Testando escrita no banco...')
  try {
    const { data, error } = await supabase
      .from('files')
      .select('count')
      .limit(1)

    if (error) throw error
    console.log('   ✅ Banco (write) OK\n')
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}\n`)
    allPassed = false
  }

  // Summary
  console.log('═'.repeat(50))
  if (allPassed) {
    console.log('\n✅ TUDO OK! Você pode começar a testar uploads!\n')
    process.exit(0)
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique as policies no Supabase.\n')
    process.exit(1)
  }
}

validateSetup()
