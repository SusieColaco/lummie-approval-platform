import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpaxhawnapjzzpvwvstq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7Slns0QK-VuWv2sw9K6fuw_ViR3RTK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDatabase() {
  console.log('🚀 Iniciando setup do Supabase...\n');

  // SQL para criar tabelas
  const SQL = `
    -- Tabela de Projetos
    CREATE TABLE IF NOT EXISTS projects (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      status TEXT DEFAULT 'Em andamento',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabela de Arquivos (PDFs)
    CREATE TABLE IF NOT EXISTS files (
      id BIGSERIAL PRIMARY KEY,
      project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(project_id, type)
    );

    -- Tabela de Roteiros
    CREATE TABLE IF NOT EXISTS scripts (
      id BIGSERIAL PRIMARY KEY,
      project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'Aguardando aprovação',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabela de Feedback do Cliente
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGSERIAL PRIMARY KEY,
      script_id BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
      project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      approval_status TEXT,
      notes TEXT,
      audio_path TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE files ENABLE ROW LEVEL SECURITY;
    ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
  `;

  try {
    // Executar SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sql: SQL }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ Tabelas criadas com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse: https://dpaxhawnapjzzpvwvstq.supabase.co/project/default/storage/buckets');
    console.log('2. Clique em "New bucket"');
    console.log('3. Nome: lummie-files');
    console.log('4. Desabilite "Public bucket"');
    console.log('5. Clique em "Create"');
    console.log('\n✨ Depois, você pode testar o upload de PDFs!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n⚠️ Você pode executar o SQL manualmente em:');
    console.log('https://dpaxhawnapjzzpvwvstq.supabase.co/project/default/sql');
  }
}

setupDatabase();
