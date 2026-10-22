-- =====================================================================
-- Metaliza · Registro do pedido com numeração SJSYS e códigos por cliente
-- Rodar no SQL Editor do Supabase DEPOIS de 20261022120000_pedidos_erp_retencao.sql.
-- Idempotente (pode rodar de novo).
-- =====================================================================

-- Número limpo do pedido (1, 2, 3...) usado no HEADER do SJSYS e nos nomes dos arquivos
create sequence if not exists public.pedidos_numero_seq;
alter table public.pedidos add column if not exists numero_seq bigint;
alter table public.pedidos alter column numero_seq set default nextval('public.pedidos_numero_seq');
update public.pedidos set numero_seq = nextval('public.pedidos_numero_seq') where numero_seq is null;
alter table public.pedidos alter column numero_seq set not null;
create unique index if not exists pedidos_numero_seq_key on public.pedidos (numero_seq);
alter sequence public.pedidos_numero_seq owned by public.pedidos.numero_seq;

-- Dados do representante no envio (nome, código, e-mail) para o espelho em PDF
alter table public.pedidos add column if not exists rep jsonb;

-- Ordem da linha (SEQ_ITEM do SJSYS) e categoria da peça (descrição do item)
alter table public.itens_pedido add column if not exists ordem integer;
alter table public.itens_pedido add column if not exists categoria text;

-- O app grava o TXT e o corpo do e-mail logo depois de receber o número do pedido
drop policy if exists "pedidos: dono atualiza" on public.pedidos;
create policy "pedidos: dono atualiza" on public.pedidos
  for update to authenticated
  using (rep_id = auth.uid())
  with check (rep_id = auth.uid());

-- Registra cabeçalho + itens numa única transação.
-- Cada item recebe o código de obter_ou_criar_codigo_item (mesma variação, mesmo código para o cliente).
-- p_pedido: { tipo, cliente: {cnpj, ...}, rep: {nome, codigo, email} }
-- p_itens:  [{ ref, categoria, acabamento_codigo, acabamento_nome, afra, elos, com_ponteira, tipo, qtd, chave_item, descricao }]
-- Retorna:  { id, numero, criado_em, codigos: ["0001", ...] } na mesma ordem dos itens
create or replace function public.registrar_pedido(p_pedido jsonb, p_itens jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cliente text := regexp_replace(coalesce(p_pedido #>> '{cliente,cnpj}', ''), '\D', '', 'g');
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

  v_seq := nextval('public.pedidos_numero_seq');
  insert into public.pedidos (numero_seq, numero, cliente_id, cliente, rep_id, rep_email, rep, tipo)
  values (v_seq, v_seq::text, v_cliente, p_pedido -> 'cliente', v_uid,
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

  return jsonb_build_object('id', v_id, 'numero', v_seq, 'criado_em', v_criado, 'codigos', v_codigos);
end;
$$;

revoke all on function public.registrar_pedido(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_pedido(jsonb, jsonb) to authenticated;
