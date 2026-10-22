-- =====================================================================
-- Metaliza · Blindagem da chave do de-para (REF|COR|AFRA[|ELOS|PONTEIRA])
-- Rodar no SQL Editor do Supabase. Idempotente (pode rodar de novo).
-- O app já monta a chave em MAIÚSCULAS e sem acento; aqui o banco garante, em qualquer caso,
-- que espaços extras (e em volta da "/" dos bicolores) nunca gerem um código novo para a mesma peça.
-- =====================================================================

-- "EF  661 | OURO LIGHT / PRETO |sem-afra" -> "EF 661|OURO LIGHT/PRETO|sem-afra"
create or replace function public.normalizar_chave_item(p_chave text)
returns text
language sql
immutable
as $$
  select coalesce(string_agg(
           regexp_replace(regexp_replace(btrim(t.seg), '\s+', ' ', 'g'), '\s*/\s*', '/', 'g'),
           '|' order by t.n), '')
    from unnest(string_to_array(coalesce(p_chave, ''), '|')) with ordinality as t(seg, n)
$$;

-- Mesma função de antes, agora normalizando a chave antes de buscar/criar o código
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
  v_chave   text := public.normalizar_chave_item(p_chave_item);
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
revoke all on function public.obter_ou_criar_codigo_item(text, text, text) from public, anon;
grant execute on function public.obter_ou_criar_codigo_item(text, text, text) to authenticated;

-- Converte as chaves já gravadas (ex.: bicolor "OURO LIGHT / PRETO" -> "OURO LIGHT/PRETO"),
-- mantendo o código que o item já tinha. Se a chave normalizada já existir para o cliente, ela
-- prevalece; a antiga continua como está e simplesmente deixa de ser usada.
do $$
declare
  r record;
begin
  for r in
    select id, cliente_id, public.normalizar_chave_item(chave_item) as nova
      from public.codigos_itens_cliente
     where chave_item <> public.normalizar_chave_item(chave_item)
     order by cliente_id, codigo_item
  loop
    if not exists (
      select 1 from public.codigos_itens_cliente o
       where o.cliente_id = r.cliente_id and o.chave_item = r.nova
    ) then
      update public.codigos_itens_cliente set chave_item = r.nova where id = r.id;
    end if;
  end loop;
end
$$;
