-- =====================================================================
-- Metaliza · Cadastro permanente de clientes (PJ)
-- Rodar no SQL Editor do Supabase DEPOIS de 20261022150000_registrar_pedido_sjsys.sql.
-- Idempotente (pode rodar de novo). Esta tabela NÃO entra na exclusão de 30 dias.
-- =====================================================================

create table if not exists public.clientes (
  id                 uuid primary key default gen_random_uuid(),
  cnpj               text not null unique check (cnpj ~ '^[0-9]{14}$'),  -- só dígitos; o app aplica a máscara
  razao_social       text not null,
  nome_fantasia      text,
  inscricao_estadual text,
  cep                text,
  endereco           text,
  numero             text,
  complemento        text,
  bairro             text,
  cidade             text not null,
  uf                 text not null,
  contato            text,
  whatsapp           text,
  email              text,
  representante_id   uuid references auth.users (id) on delete set null default auth.uid(),
  ultimo_pedido_em   timestamptz,          -- nulo = cliente novo (nunca enviou pedido)
  criado_em          timestamptz not null default now()
);
create index if not exists clientes_razao_idx on public.clientes (razao_social);

alter table public.clientes enable row level security;

drop policy if exists "clientes: leitura autenticada" on public.clientes;
create policy "clientes: leitura autenticada" on public.clientes
  for select to authenticated using (true);

drop policy if exists "clientes: cadastro autenticado" on public.clientes;
create policy "clientes: cadastro autenticado" on public.clientes
  for insert to authenticated
  with check (representante_id is null or representante_id = auth.uid());

-- registrar_pedido passa a marcar o cliente: devolve cliente_novo (sem pedido anterior) e grava
-- ultimo_pedido_em. Se o cliente não estiver na tabela (ex.: cadastrado offline), entra agora.
create or replace function public.registrar_pedido(p_pedido jsonb, p_itens jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cli     jsonb := coalesce(p_pedido -> 'cliente', '{}'::jsonb);
  v_cliente text := regexp_replace(coalesce(v_cli ->> 'cnpj', ''), '\D', '', 'g');
  v_novo    boolean;
  v_seq     bigint;
  v_id      uuid;
  v_criado  timestamptz;
  v_item    jsonb;
  v_ordem   bigint;
  v_codigo  text;
  v_codigos jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Login obrigatório para registrar pedidos';
  end if;
  if length(v_cliente) <> 14 then
    raise exception 'CNPJ do cliente inválido';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Pedido sem itens';
  end if;

  -- Cliente novo ou já cadastrado (trava a linha: dois envios simultâneos não contam ambos como "novo")
  select c.ultimo_pedido_em is null into v_novo
    from public.clientes c where c.cnpj = v_cliente for update;
  if not found then
    insert into public.clientes
      (cnpj, razao_social, nome_fantasia, inscricao_estadual, cep, endereco, numero, complemento,
       bairro, cidade, uf, contato, whatsapp, email, representante_id)
    values
      (v_cliente,
       coalesce(nullif(v_cli ->> 'razaoSocial', ''), nullif(v_cli ->> 'nome', ''), v_cliente),
       nullif(v_cli ->> 'fantasia', ''), nullif(v_cli ->> 'ie', ''), nullif(v_cli ->> 'cep', ''),
       nullif(v_cli ->> 'logradouro', ''), nullif(v_cli ->> 'numero', ''), nullif(v_cli ->> 'complemento', ''),
       nullif(v_cli ->> 'bairro', ''), coalesce(nullif(v_cli ->> 'municipio', ''), ''), coalesce(nullif(v_cli ->> 'uf', ''), ''),
       nullif(v_cli ->> 'contato', ''), nullif(v_cli ->> 'whatsapp', ''), nullif(v_cli ->> 'email', ''), v_uid)
    on conflict (cnpj) do nothing;
    v_novo := true;
  end if;
  update public.clientes set ultimo_pedido_em = now() where cnpj = v_cliente;

  v_seq := nextval('public.pedidos_numero_seq');
  insert into public.pedidos (numero_seq, numero, cliente_id, cliente, rep_id, rep_email, rep, tipo)
  values (v_seq, v_seq::text, v_cliente, v_cli, v_uid,
          lower(p_pedido #>> '{rep,email}'), p_pedido -> 'rep', p_pedido ->> 'tipo')
  returning id, criado_em into v_id, v_criado;

  for v_item, v_ordem in
    select e.valor, e.ordem from jsonb_array_elements(p_itens) with ordinality as e(valor, ordem) order by e.ordem
  loop
    v_codigo := public.obter_ou_criar_codigo_item(v_cliente, v_item ->> 'chave_item', v_item ->> 'descricao');
    insert into public.itens_pedido
      (pedido_id, ordem, ref, categoria, acabamento_codigo, acabamento_nome, afra, elos, com_ponteira, tipo, qtd, codigo_item, descricao)
    values
      (v_id, v_ordem, v_item ->> 'ref', v_item ->> 'categoria', v_item ->> 'acabamento_codigo', v_item ->> 'acabamento_nome',
       nullif(v_item ->> 'afra', ''), (v_item ->> 'elos')::integer, (v_item ->> 'com_ponteira')::boolean,
       v_item ->> 'tipo', (v_item ->> 'qtd')::integer, v_codigo, v_item ->> 'descricao');
    v_codigos := v_codigos || to_jsonb(v_codigo);
  end loop;

  return jsonb_build_object('id', v_id, 'numero', v_seq, 'criado_em', v_criado, 'codigos', v_codigos, 'cliente_novo', v_novo);
end;
$$;

revoke all on function public.registrar_pedido(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_pedido(jsonb, jsonb) to authenticated;
