-- =====================================================================
-- Metaliza · Pedido é 100% Amostra ou 100% Pedido de Produção (fim do tipo "misto")
-- Rodar no SQL Editor do Supabase. Idempotente (pode rodar de novo).
-- =====================================================================

-- NOT VALID: vale para todo pedido novo sem recusar os "misto" antigos, que somem na purga de 30 dias
alter table public.pedidos drop constraint if exists pedidos_tipo_check;
alter table public.pedidos
  add constraint pedidos_tipo_check check (tipo in ('amostra', 'producao')) not valid;
