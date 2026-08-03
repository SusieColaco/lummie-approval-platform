# LUMMIE — Plataforma de Aprovação de Projetos

Plataforma web elegante e intuitiva para gerenciar roteiros de vídeo, compartilhar documentos e agendar gravações com clientes.

## 🎯 Fase 1: Painel de Roteiros

- ✅ Admin dashboard para criar/gerenciar projetos
- ✅ Portal cliente com visualização de roteiros
- ✅ Design LUMMIE (Neue Montreal Tight + Instrument Sans)
- ⏭️ Sistema de comentários (próxima semana)
- ⏭️ Upload de arquivos (Fase 2)
- ⏭️ Integração Google Agenda (Fase 3)

## 🚀 Como Rodar

### Instalação

```bash
npm install
# ou
yarn install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` baseado em `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Preencha com suas credenciais do Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura

```
app/
  ├── admin/           # Painel administrativo
  ├── client/          # Portal do cliente
  ├── page.tsx         # Home
  └── globals.css      # Estilos globais LUMMIE

components/
  ├── AdminNav.tsx     # Navegação admin
  └── ClientNav.tsx    # Navegação cliente
```

## 🎨 Design

- **Cores LUMMIE**
  - Preto quente: `#111010`
  - Creme: `#F4F0E7`
  - Dourado: `#B69763`
  - Grafite: `#4E4B47`

- **Tipografia**
  - Neue Montreal Tight (principal)
  - Instrument Sans (secundária)

- **Filosofia**
  - Luxo silencioso
  - Editorial e arquitetural
  - Muito espaço em branco

## 📝 Status

- [x] Setup inicial
- [x] Componentização base
- [x] Layout admin
- [x] Layout cliente
- [ ] Autenticação Supabase
- [ ] Sistema de roteiros
- [ ] Comentários
- [ ] Upload de arquivos
- [ ] Google Calendar API

---

© 2026 LUMMIE Studio · Luz que revela
