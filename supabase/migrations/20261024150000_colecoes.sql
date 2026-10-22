-- =====================================================================
-- Metaliza · Coleções de lançamento (aba "Nova Coleção" do Painel Admin)
-- Rodar no SQL Editor do Supabase DEPOIS de 20261024120000_painel_admin.sql.
-- Idempotente (pode rodar de novo).
-- Leitura pública (anon e authenticated); INSERT/UPDATE/DELETE só administradores
-- (app_metadata.role = "admin" no token do Supabase Auth).
-- =====================================================================

create table if not exists public.colecoes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  data_lancamento date not null default current_date,
  dias_validade   integer not null default 90 check (dias_validade between 1 and 365),
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now()
);
create unique index if not exists colecoes_nome_unico on public.colecoes (lower(nome));

-- Mesma regra de administrador do painel (recriada aqui para o script funcionar sozinho)
create or replace function public.eh_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

alter table public.colecoes enable row level security;

drop policy if exists "colecoes: leitura" on public.colecoes;
create policy "colecoes: leitura" on public.colecoes
  for select to anon, authenticated using (true);

drop policy if exists "colecoes: admin cadastra" on public.colecoes;
create policy "colecoes: admin cadastra" on public.colecoes
  for insert to authenticated with check (public.eh_admin());

drop policy if exists "colecoes: admin altera" on public.colecoes;
create policy "colecoes: admin altera" on public.colecoes
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- O app usa o DELETE para desfazer um lançamento cujas peças não puderam ser atualizadas
drop policy if exists "colecoes: admin remove" on public.colecoes;
create policy "colecoes: admin remove" on public.colecoes
  for delete to authenticated using (public.eh_admin());

grant select on public.colecoes to anon, authenticated;
grant insert, update, delete on public.colecoes to authenticated;

-- O lançamento atualiza produtos.colecao das peças marcadas: precisa da política
-- "produtos: admin altera" (criada em 20261024120000_painel_admin.sql).
