-- =====================================================================
-- Metaliza · Pedidos, de-para de itens por cliente (SJSYS) e retenção de 30 dias
-- Rodar no SQL Editor do Supabase. O script é idempotente (pode rodar de novo).
-- =====================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. De-para: mesma peça/cor para o mesmo cliente => sempre o mesmo código
-- ---------------------------------------------------------------------
create table if not exists public.codigos_itens_cliente (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  text not null,                 -- CNPJ só com dígitos (estável entre aparelhos)
  chave_item  text not null,                 -- ref|cor|afra|elos|ponteira
  codigo_item text not null check (codigo_item ~ '^[0-9]{4}$'),
  descricao   text,
  criado_em   timestamptz not null default now(),
  constraint codigos_itens_cliente_unico unique (cliente_id, chave_item),
  constraint codigos_itens_cliente_codigo_unico unique (cliente_id, codigo_item)
);

-- Busca o código já usado para esta variação deste cliente, ou cria o próximo ('0001', '0002'...).
-- O advisory lock por cliente serializa chamadas simultâneas, então dois pedidos ao mesmo
-- tempo nunca recebem o mesmo número.
create or replace function public.obter_ou_criar_codigo_item(
  p_cliente_id text,
  p_chave_item text,
  p_descricao  text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente text := regexp_replace(coalesce(p_cliente_id, ''), '\D', '', 'g');
  v_chave   text := btrim(coalesce(p_chave_item, ''));
  v_codigo  text;
  v_proximo integer;
begin
  if v_cliente = '' or v_chave = '' then
    raise exception 'cliente_id e chave_item são obrigatórios';
  end if;

  perform pg_advisory_xact_lock(hashtext('codigos_itens_cliente:' || v_cliente));

  select codigo_item into v_codigo
    from public.codigos_itens_cliente
   where cliente_id = v_cliente and chave_item = v_chave;
  if found then
    return v_codigo;
  end if;

  select coalesce(max(codigo_item::integer), 0) + 1 into v_proximo
    from public.codigos_itens_cliente
   where cliente_id = v_cliente;
  if v_proximo > 9999 then
    raise exception 'Cliente % atingiu o limite de 9999 códigos de item', v_cliente;
  end if;

  v_codigo := lpad(v_proximo::text, 4, '0');
  insert into public.codigos_itens_cliente (cliente_id, chave_item, codigo_item, descricao)
  values (v_cliente, v_chave, v_codigo, p_descricao);
  return v_codigo;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Pedidos e itens (itens apagados junto com o pedido)
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  numero      text not null unique,          -- ex.: PV-2026-04181
  cliente_id  text not null,                 -- CNPJ só com dígitos
  cliente     jsonb not null,                -- dados cadastrais/fiscais no momento do envio
  rep_id      uuid default auth.uid(),
  rep_email   text,
  tipo        text not null check (tipo in ('amostra', 'producao', 'misto')),
  texto_txt   text,                          -- arquivo de importação SJSYS (quando gerado)
  email_corpo text,                          -- texto enviado ao PCP
  criado_em   timestamptz not null default now()
);
create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em);
create index if not exists pedidos_rep_idx on public.pedidos (rep_id, criado_em desc);

create table if not exists public.itens_pedido (
  id                uuid primary key default gen_random_uuid(),
  pedido_id         uuid not null references public.pedidos (id) on delete cascade,
  ref               text not null,
  acabamento_codigo text not null,
  acabamento_nome   text not null,
  afra              text,
  elos              integer check (elos between 2 and 100),
  com_ponteira      boolean,
  tipo              text not null check (tipo in ('amostra', 'producao')),
  qtd               integer not null check (qtd > 0),
  codigo_item       text check (codigo_item ~ '^[0-9]{4}$'),  -- vindo de obter_ou_criar_codigo_item
  descricao         text,
  criado_em         timestamptz not null default now()
);
create index if not exists itens_pedido_pedido_idx on public.itens_pedido (pedido_id);

-- ---------------------------------------------------------------------
-- Segurança (RLS): cada representante só vê e grava os próprios pedidos.
-- O de-para só é lido pelo app; a gravação passa pela função acima.
-- ---------------------------------------------------------------------
alter table public.codigos_itens_cliente enable row level security;
alter table public.pedidos enable row level security;
alter table public.itens_pedido enable row level security;

drop policy if exists "codigos: leitura autenticada" on public.codigos_itens_cliente;
create policy "codigos: leitura autenticada" on public.codigos_itens_cliente
  for select to authenticated using (true);

drop policy if exists "pedidos: dono lê" on public.pedidos;
create policy "pedidos: dono lê" on public.pedidos
  for select to authenticated using (rep_id = auth.uid());
drop policy if exists "pedidos: dono grava" on public.pedidos;
create policy "pedidos: dono grava" on public.pedidos
  for insert to authenticated with check (rep_id = auth.uid());

drop policy if exists "itens: dono lê" on public.itens_pedido;
create policy "itens: dono lê" on public.itens_pedido
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.rep_id = auth.uid()));
drop policy if exists "itens: dono grava" on public.itens_pedido;
create policy "itens: dono grava" on public.itens_pedido
  for insert to authenticated
  with check (exists (select 1 from public.pedidos p where p.id = pedido_id and p.rep_id = auth.uid()));

revoke all on function public.obter_ou_criar_codigo_item(text, text, text) from public, anon;
grant execute on function public.obter_ou_criar_codigo_item(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Exclusão definitiva em 30 dias (pedido + itens, pelo cascade)
--    O de-para de códigos NÃO é apagado: o mesmo item continua com o mesmo código.
-- ---------------------------------------------------------------------
create or replace function public.purgar_pedidos_expirados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apagados integer;
begin
  delete from public.pedidos
   where criado_em < now() - interval '30 days';
  get diagnostics v_apagados = row_count;
  return v_apagados;
end;
$$;
revoke all on function public.purgar_pedidos_expirados() from public, anon, authenticated;

-- Agendamento diário (03:17 UTC) com pg_cron. Se a extensão não estiver disponível,
-- o script segue e avisa; nesse caso, ative "pg_cron" em Database > Extensions e rode de novo.
do $cron$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron indisponível: agendamento não criado';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'metaliza-purgar-pedidos-30-dias';
  perform cron.schedule(
    'metaliza-purgar-pedidos-30-dias',
    '17 3 * * *',
    'select public.purgar_pedidos_expirados();'
  );
end
$cron$;
