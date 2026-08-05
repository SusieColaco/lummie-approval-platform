-- Migração: suportar o novo fluxo baseado em clients (não mais em projects)
-- Execute no SQL Editor do Supabase: https://dpaxhawnapjzzpvwvstq.supabase.co/project/default/sql

-- scripts: liberar project_id (roteiros do novo fluxo não têm project)
ALTER TABLE scripts ALTER COLUMN project_id DROP NOT NULL;

-- feedback: vincular a clients em vez de apenas projects
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE feedback ALTER COLUMN project_id DROP NOT NULL;

-- demands: faltava policy de RLS (tabela nova, ainda sem policy = bloqueia tudo)
DROP POLICY IF EXISTS "allow_all_demands" ON demands;
CREATE POLICY "allow_all_demands" ON demands
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);
