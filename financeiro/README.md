# Financeiro — Plataforma Financeira Pessoal

Next.js (App Router) + Supabase (Postgres, Auth, RLS, Storage) + Claude API, para uso pessoal.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS 4
- Supabase: Postgres, Auth, Row Level Security, Storage
- Claude API (`@anthropic-ai/sdk`) — chamadas server-side apenas
- Recharts, Lucide Icons
- Importação de extrato: `exceljs` (XLSX), `papaparse` (CSV), `pdf-parse` (PDF)

## Setup

### 1. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com) e, no **SQL Editor**, rode nesta ordem:

1. `supabase/migrations/0001_init.sql` — tabelas, RLS e o bucket de Storage
2. `supabase/migrations/0002_seed_helpers.sql` — categorias padrão automáticas para cada novo usuário + função de limpeza de dados demo
3. `supabase/migrations/0003_confirmed_transactions_view.sql` — view usada por todas as leituras "reais" (dashboard, transações, insights, chat), que ignora importações ainda em revisão

Se preferir, use a CLI do Supabase (`supabase db push`) apontando para a pasta `supabase/migrations`.

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — em Project Settings → API no Supabase
- `ANTHROPIC_API_KEY` — em [console.anthropic.com](https://console.anthropic.com)

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`, crie sua conta (uso pessoal — um único usuário) e comece a usar.

### 4. Popular com dados de demonstração (opcional)

Em **Configurações**, use "Popular com dados demo" para explorar a plataforma com contas, transações,
cartão, compromissos e metas fictícios (marcados com `is_demo = true`). Quando for usar dados reais, use
"Apagar dados demo" para remover tudo de uma vez.

## Estrutura

```
src/
  app/
    login/                    Autenticação (Server Actions + Supabase Auth)
    auth/signout/              Rota de logout
    api/chat/                  Route Handler que chama a Claude API (server-side)
    (app)/                     Rotas autenticadas, com sidebar
      dashboard/
      transacoes/
      importar/                 Upload → parsing → revisão → confirmação
        [batchId]/
      contas/
      cartoes/
      compromissos/
      metas/
      financeiro/                Chat com a Claude
      insights/                  Leituras automáticas (sem IA)
      configuracoes/
  components/
  lib/
    supabase/                  Clientes browser/server + refresh de sessão no proxy
    import/                    Parsers de CSV/XLSX/PDF + categorização automática
    database.types.ts           Tipos do schema (escritos à mão a partir das migrations)
    claude.ts                    Cliente da Claude API (server-only)
supabase/
  migrations/                  SQL do schema, RLS e helpers
```

## Notas de arquitetura

- **RLS**: toda tabela com `user_id` tem policy `user_id = auth.uid()`. Mesmo sendo uso pessoal, os dados só
  são acessíveis pelo usuário autenticado dono da sessão.
- **Claude API**: só é chamada em `src/app/api/chat/route.ts`, nunca no client. O contexto enviado é um
  resumo estruturado (JSON) montado a partir de consultas SQL específicas — nunca o banco inteiro — e o
  prompt instrui a IA a nunca inventar números.
- **Importação**: os arquivos são parseados no servidor e as transações são gravadas vinculadas a um
  `import_batches` com status `em_revisao`. A view `transactions_confirmed` (usada em todo o resto da
  aplicação) ignora essas linhas até você confirmar a revisão, quando o saldo da conta é recalculado e
  correções manuais de categoria viram `categorization_rules` para futuras importações.
