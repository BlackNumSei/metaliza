-- =====================================================================
-- Metaliza · Painel de Cadastro (Admin): gravação de cores, peças e fotos só para administradores
-- Rodar no SQL Editor do Supabase. Idempotente (pode rodar de novo).
--
-- Administrador = usuário do Supabase Auth com app_metadata.role = "admin".
-- O app_metadata só pode ser alterado pelo servidor (SQL Editor / service role), nunca pelo próprio usuário.
-- Depois de mudar o papel de alguém, a pessoa precisa sair e entrar de novo no app (o token é renovado no login).
-- =====================================================================

create or replace function public.eh_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- ---------------------------------------------------------------------
-- Cores: leitura continua liberada (política já existente); cadastro só admin
-- ---------------------------------------------------------------------
alter table public.cores add column if not exists bicolor boolean;
update public.cores set bicolor = (nome like '%/%' or coalesce(array_length(codigos, 1), 0) > 1) where bicolor is null;
alter table public.cores alter column ativo set default true;

drop policy if exists "cores: admin cadastra" on public.cores;
create policy "cores: admin cadastra" on public.cores
  for insert to authenticated with check (public.eh_admin());
drop policy if exists "cores: admin altera" on public.cores;
create policy "cores: admin altera" on public.cores
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- ---------------------------------------------------------------------
-- Produtos (peças do catálogo): leitura para todos; cadastro e alteração só admin
-- ---------------------------------------------------------------------
create table if not exists public.produtos (
  id        uuid primary key default gen_random_uuid(),
  ref       text not null,
  categoria text not null,
  colecao   text,
  foto      text,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.produtos add column if not exists colecao text;
alter table public.produtos add column if not exists foto text;
alter table public.produtos add column if not exists ativo boolean default true;
alter table public.produtos alter column ativo set default true;

-- Referência única (sem diferenciar maiúsculas). Se já houver repetidas, avisa e segue sem o índice.
do $$
begin
  create unique index if not exists produtos_ref_unica on public.produtos (upper(ref));
exception when unique_violation then
  raise notice 'Há referências repetidas em produtos: índice único não criado. Corrija as duplicadas e rode de novo.';
end
$$;

alter table public.produtos enable row level security;
drop policy if exists "produtos: leitura" on public.produtos;
create policy "produtos: leitura" on public.produtos
  for select to anon, authenticated using (true);
drop policy if exists "produtos: admin cadastra" on public.produtos;
create policy "produtos: admin cadastra" on public.produtos
  for insert to authenticated with check (public.eh_admin());
drop policy if exists "produtos: admin altera" on public.produtos;
create policy "produtos: admin altera" on public.produtos
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
grant select on public.produtos to anon, authenticated;
grant insert, update on public.produtos to authenticated;
grant insert, update on public.cores to authenticated;

-- ---------------------------------------------------------------------
-- Fotos: bucket público "produtos" (o app mostra a foto pela URL pública); envio só admin
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "fotos produtos: admin envia" on storage.objects;
create policy "fotos produtos: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'produtos' and public.eh_admin());
drop policy if exists "fotos produtos: admin remove" on storage.objects;
create policy "fotos produtos: admin remove" on storage.objects
  for delete to authenticated
  using (bucket_id = 'produtos' and public.eh_admin());

-- ---------------------------------------------------------------------
-- Usuário Demo como administrador (fase de testes)
-- Antes: crie o usuário em Authentication > Users > Add user (e-mail e senha).
-- Para tirar o acesso depois: troque '{"role":"admin"}' por '{"role":"representante"}'.
-- ---------------------------------------------------------------------
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
 where lower(email) = 'carlos.mendes@metaliza.com.br';
