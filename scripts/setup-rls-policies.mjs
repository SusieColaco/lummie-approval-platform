import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpaxhawnapjzzpvwvstq.supabase.co';
const SUPABASE_KEY = 'sbp_2a86e8ce8dd7acf03e0ddb92c09dac4c6fb8cc3a'; // Service Role Key needed for policies

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupRLSPolicies() {
  console.log('🔐 Configurando RLS Policies...\n');

  const SQL = `
    -- POLICIES PARA STORAGE (lummie-files bucket)

    -- Permitir upload (INSERT) para todos
    CREATE POLICY "allow_upload" ON storage.objects
      FOR INSERT TO authenticated, anon
      WITH CHECK (bucket_id = 'lummie-files');

    -- Permitir leitura (SELECT) de arquivos públicos
    CREATE POLICY "allow_read" ON storage.objects
      FOR SELECT TO authenticated, anon
      USING (bucket_id = 'lummie-files');

    -- Permitir delete para usuários autenticados
    CREATE POLICY "allow_delete" ON storage.objects
      FOR DELETE TO authenticated, anon
      USING (bucket_id = 'lummie-files');

    -- POLICIES PARA TABELAS

    -- Projects: permitir leitura e escrita
    CREATE POLICY "allow_all_projects" ON projects
      FOR ALL TO authenticated, anon
      USING (true)
      WITH CHECK (true);

    -- Files: permitir leitura e escrita
    CREATE POLICY "allow_all_files" ON files
      FOR ALL TO authenticated, anon
      USING (true)
      WITH CHECK (true);

    -- Scripts: permitir leitura e escrita
    CREATE POLICY "allow_all_scripts" ON scripts
      FOR ALL TO authenticated, anon
      USING (true)
      WITH CHECK (true);

    -- Feedback: permitir leitura e escrita
    CREATE POLICY "allow_all_feedback" ON feedback
      FOR ALL TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': \`Bearer \${SUPABASE_KEY}\`,
      },
      body: JSON.stringify({ sql: SQL }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(\`HTTP \${response.status}: \${error}\`);
    }

    console.log('✅ RLS Policies criadas com sucesso!');
    console.log('✨ Agora os uploads devem funcionar!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n⚠️ Alternativa: Acesse o SQL Editor em:');
    console.log('https://dpaxhawnapjzzpvwvstq.supabase.co/project/default/sql');
    console.log('E execute as queries acima.\n');
  }
}

setupRLSPolicies();
