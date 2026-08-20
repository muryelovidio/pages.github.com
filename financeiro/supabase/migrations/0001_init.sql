-- Plataforma Financeira Pessoal — schema inicial
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- Contas
-- ============================================================
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('banco', 'dinheiro', 'investimento')),
  initial_balance numeric not null default 0,
  current_balance numeric not null default 0,
  color text default '#F97316',
  icon text default 'wallet',
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Categorias
-- ============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'tag',
  color text default '#F97316',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Regras de categorização aprendidas
-- ============================================================
create table if not exists categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_pattern text not null,
  category_id uuid not null references categories(id) on delete cascade,
  match_type text not null default 'contains' check (match_type in ('contains', 'exact', 'regex')),
  confidence numeric not null default 1.0,
  created_at timestamptz not null default now(),
  unique (user_id, match_pattern, match_type)
);

-- ============================================================
-- Cartões
-- ============================================================
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  limit_amount numeric,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  color text default '#111827',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists card_invoices (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_month date not null,
  total_amount numeric not null default 0,
  status text not null default 'aberta' check (status in ('aberta', 'fechada', 'paga')),
  created_at timestamptz not null default now(),
  unique (card_id, reference_month)
);

-- ============================================================
-- Lotes de importação
-- ============================================================
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_filename text not null,
  file_type text not null check (file_type in ('pdf', 'csv', 'xlsx')),
  account_id uuid references accounts(id) on delete set null,
  imported_at timestamptz not null default now(),
  status text not null default 'em_revisao' check (status in ('em_revisao', 'concluido'))
);

-- ============================================================
-- Transações
-- ============================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  date date not null,
  description text not null,
  raw_description text,
  amount numeric not null,
  type text not null check (type in ('entrada', 'saida')),
  status text not null default 'confirmado' check (status in ('confirmado', 'pendente')),
  card_id uuid references cards(id) on delete set null,
  import_batch_id uuid references import_batches(id) on delete set null,
  dedupe_hash text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on transactions (user_id, date desc);
create index if not exists transactions_dedupe_idx on transactions (user_id, dedupe_hash);
create index if not exists transactions_batch_idx on transactions (import_batch_id);

-- ============================================================
-- Compromissos (contas futuras)
-- ============================================================
create table if not exists commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  due_day int not null check (due_day between 1 and 31),
  recurrence text not null default 'mensal' check (recurrence in ('mensal', 'unico')),
  category_id uuid references categories(id) on delete set null,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Metas
-- ============================================================
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date date,
  monthly_contribution numeric default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Histórico do chat com a IA
-- ============================================================
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — cada usuário só acessa seus próprios dados
-- ============================================================
alter table accounts enable row level security;
alter table categories enable row level security;
alter table categorization_rules enable row level security;
alter table cards enable row level security;
alter table card_invoices enable row level security;
alter table import_batches enable row level security;
alter table transactions enable row level security;
alter table commitments enable row level security;
alter table goals enable row level security;
alter table chat_messages enable row level security;

create policy "own rows" on accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on categorization_rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on cards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on card_invoices for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on import_batches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on commitments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on chat_messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Storage bucket para os extratos originais
-- ============================================================
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false)
on conflict (id) do nothing;

create policy "own statement files read"
  on storage.objects for select
  using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own statement files write"
  on storage.objects for insert
  with check (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own statement files delete"
  on storage.objects for delete
  using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
