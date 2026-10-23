# Metaliza · App do Representante

Protótipo interativo (React + Tailwind CSS, só com estado local) do fluxo comercial de uma empresa de cromagem/metalização de componentes para calçados femininos.

- **Componente único:** `src/MetalizaApp.jsx` (export default `MetalizaApp`). Ele usa `react`, `lucide-react` (ícones de menu, fechar e setas do carrossel) e classes Tailwind. Os tokens de cor e as fontes vêm de um `<style>` interno, então não exige configuração extra do Tailwind.
- **Preview standalone:** `preview/index.html`, que abre direto no navegador (React, lucide-react e Tailwind via CDN). Para regenerar depois de editar o componente: `npm install && npm run preview:build`.

## Identidade visual e uso no celular

- **Marca:**
  - Logo oficial da Metaliza no cabeçalho, no menu lateral e no login.
  - Cor primária é o azul da logo (`#203F6E`), usado em botões, estados ativos, bordas de seleção e badges.
  - Fundo branco, com cinzas de apoio `#F8FAFC` e `#F1F5F9` e textos `#0F172A` e `#334155`. Fonte Plus Jakarta Sans.
- **Mobile-first:**
  - Botões, seletores e chips com no mínimo 44–48 px de altura.
  - Campos com texto de 16 px, para o iPhone não dar zoom.
  - Catálogo em grade de 2 colunas no celular, com as fotos inteiras (`object-contain`).
  - Filtros em faixa com rolagem horizontal.
  - Carrossel com troca por deslize (swipe).
- **Bottom sheets:** a peça, a seleção de cliente e o pedido sobem de baixo, com alça (arrastar para baixo fecha). No computador viram janela centralizada e painel lateral.
- **Barra inferior fixa no catálogo:** mostra o cliente e o resumo do pedido ("Ver pedido"), ou "Selecionar cliente" no Modo Apresentação.
- **Menu lateral:** ocupa 84% da largura no celular. Fecha no X, no Esc ou tocando fora.

## Fluxo

1. **Login:** email/senha (`carlos.mendes@metaliza.com.br` / `demo123`) ou o botão "Entrar como Representante Demonstração".
2. **Modo de acesso**, logo após o login:
   - **Atendimento a Cliente:**
     - Abre a seleção de cliente: 3 fábricas pré-cadastradas, seleção com 1 clique, e cadastro completo de cliente PJ (CNPJ, IE, razão social, endereço e contato).
     - Depois segue para o catálogo com carrinho e pedidos liberados.
   - **Apenas Mostrar Catálogo (Modo Apresentação):**
     - Vai direto para a vitrine, sem cliente. O cabeçalho mostra `Modo Apresentação • Sem cliente selecionado`.
     - Ao tocar em "Adicionar ao pedido" (ou no botão Pedido), a peça configurada fica guardada e abre o modal "Para iniciar o pedido, selecione o cliente que está atendendo", com a lista de clientes e o cadastro rápido.
     - Escolhido o cliente, a peça entra no carrinho dele e o app passa para o atendimento normal.
     - Fechar o modal descarta a peça pendente.
   - A gaveta lateral tem "Trocar modo de acesso".
3. **Showroom:** é a vitrine do catálogo.
   - **Carrossel de destaques no topo:** só banners de coleção (Verão 2026 e Catálogo Geral / Linha Permanente), com setas e indicadores.
   - **Menu hambúrguer:** abre uma gaveta lateral com as visões do catálogo e os dados do representante e do cliente. Fecha no X, no Esc ou clicando fora.
   - **Peças:** 7 referências reais (mais a corrente CR 101). As fotos originais estão embutidas e aparecem inteiras (`object-contain`), sem cortes nem alteração de cor:

     | Grupo | Referências |
     |---|---|
     | Lançamento Verão 2026 | EF 661 (Enfeites), EF 1170 (Enfeites), PS 1030 (Passadores) |
     | Linha permanente | EF 1143 (Enfeites), EF 1150 (Enfeites), PS 1027 (Passadores), PS 057 (Passadores) |

   - **Categorias:** Enfeites, Fivelas, Passadores e Ponteiras.
   - **Filtros:** por categoria (Enfeites, Fivelas, Passadores, Ponteiras, Correntes) e busca por referência.

## Coleções e ciclo de 90 dias

- **Exclusividade:** a navegação tem só duas visões, **Catálogo Geral / Linha Permanente** e **Verão 2026**, sem uma visão misturada. As peças de lançamento aparecem só na visão da coleção enquanto ela estiver em vigor.
- **Abertura:** depois de escolher o cliente, o app abre no lançamento ativo (Verão 2026). Sem lançamento ativo, abre na linha permanente.
- **Ciclo:**
  - Cada coleção vale 90 dias a partir do lançamento.
  - A gaveta mostra "🔥 Coleção ativa • Restam N dias" com uma barra de progresso.
  - Na demonstração, o lançamento é simulado 48 dias antes do dia atual, para sempre abrir com 42 dias restantes.
  - Ao fim do prazo, a coleção se encerra sozinha.
- **Teste:**
  - O botão "Simular expiração (90 dias)", na gaveta, encerra a coleção e migra as peças para o Catálogo Geral / Linha.
  - A coleção fica riscada no menu, e o slide do carrossel passa a levar para a linha permanente.
  - "Desfazer simulação" reativa a coleção e volta para ela.
- **Espelho do pedido:** a linha `Coleção:` mostra o lançamento ativo ou "Linha permanente", calculado no momento do envio.

4. **Configuração da peça:** foto de referência em Ouro Light. Todas as peças têm um único seletor, "Cor do Acabamento". Peças de duas cores usam um acabamento bicolor pronto da cartela. Enfeites e Fivelas têm o módulo de Afra. Depois vêm o tipo (Amostra ou Pedido de Produção) e a quantidade com mínimo.
5. **Pedido:** painel lateral agrupado em Amostras e Produção, com ajuste de quantidade e remoção. O pedido é guardado separadamente para cada cliente.
6. **Revisão e envio:** confirmação e número da solicitação. Depois vêm os arquivos do pedido (PDF e, para os liberados, TXT) e o e-mail para a fábrica pelo Gmail.

## Acabamentos (sem material)

O representante não classifica o material de injeção (ABS, TPU, PVC etc.): o PCP define o material do molde ao digitar o pedido no ERP. A foto é sempre a original e não muda com a cor selecionada. Todas as cores ficam liberadas para qualquer peça:

- **Banhos:** Ouro Light (padrão), Ouro 24k, Níquel, Ônix e Marrom.

Não existe mais seleção separada de Parte de Cima / Parte de Baixo: peças de duas cores usam os bicolores prontos (50 Ouro Light / Preto, 51 Dourado / Branco).

### Cartela do Supabase (tabela `cores`)

Com Supabase, o app carrega as cores ativas ao abrir e de novo após o login (`select("*").eq("ativo", true).order("nome")`). Como a API devolve no máximo 1.000 linhas por consulta, a leitura é paginada com `.range()` em lotes de 1.000 até o fim da tabela (as 2.920 cores entram inteiras). Colunas usadas: `nome` e `codigos` (`TEXT[]`: um código na cor solo, dois nos bicolores; ex.: `nome = "002 CORAL/ 293 OURO LIGHT"`, `codigos = {002,293}`). Sem Supabase, com erro ou com a tabela vazia, vale a cartela de demonstração.

- **Seleção:** no modal da peça, o campo "Cor do Acabamento" mostra a cor escolhida; "Trocar" abre a tela cheia **Selecionar Acabamento** (cabeçalho fixo com busca, botão de limpar e contador; lista vertical rolável, uma cor por linha, com bolinha, códigos em pílulas e nome completo). Tocar na cor seleciona, fecha a tela e volta ao modal.
- **Busca, sem limite de resultados:** texto procura no nome; número procura no início de cada código de `codigos` (zeros à esquerda opcionais). `293` traz a cor solo e todos os bicolores com 293 (nunca o 1293); `002 293` traz só os que têm os dois. Partição estrita em dois baldes: primeiro as cores **solo** (sem a flag `bicolor` da tabela e sem `/` no nome; as que começam com o termo à frente), depois as **bicolores** em ordem alfabética. Bate = nome contém o termo ou algum código começa com ele. Sem termo, a lista mostra as 50 primeiras e o contador informa o total.
- **Cor exata:** código e nome da cor escolhida são gravados no item ao adicionar e vão assim para o TXT e para o PDF (ex.: `[002/293] 002 CORAL/ 293 OURO LIGHT`).
- **Padrão:** Ouro Light solo, se existir na tabela.

## Regras técnicas do modal

- **Cores da cartela:** 6 Ouro Light (padrão), 1 Ouro 24k, 2 Níquel, 3 Ônix, 4 Marrom e os bicolores 50 Ouro Light / Preto e 51 Dourado / Branco. Não há efeitos especiais (Aura e Policarbonato foram retirados). Cada botão mostra o código junto da cor.
- **Cor oculta:** 1554 Ouro Queimado não aparece na cartela.
  - Para selecionar, digite `1554` (ou "ouro queimado") no campo "Buscar cor por código ou nome".
  - A cor aparece como "Cor encontrada pelo código" e já fica selecionada.
  - Um nome que corresponde a várias cores, como "ouro", lista as opções em vez de escolher uma.
- **Afra:**
  - Aparece só em Enfeites e Fivelas. Não existe para Passadores e Ponteiras.
  - Opções "Sem Afra" (padrão) ou "Com Afra", com os códigos da Linha 800 (800–807) e da Linha 900 (901–907).

## Identificação técnica

As peças não têm nome fantasia: o identificador é a referência, sempre em caixa alta com o prefixo `Ref.`.

- **Card:** mostra `Ref. EF 661` em destaque e, abaixo, `Enfeite`.
- **Modal:** o título é `Ref. EF 661` e o subtítulo é `Categoria: Enfeite`.
- **Busca:** só por referência, sem diferenciar espaço ou caixa (`ef1170` encontra `EF 1170`).

As linhas abaixo aparecem na sacola e na revisão (a Afra só aparece quando escolhida). As peças não vão no texto do e-mail: elas seguem no espelho em PDF.

```
Ref. EF 661 - Enfeite · Acabamento: [Cód. 6] Ouro Light · Qtd: 1.000 un
Ref. EF 1170 - Enfeite · Acabamento: [Cód. 50] Ouro Light / Preto · Qtd: 500 un
Ref. CR 101 - Corrente · 45 elos · Com Ponteira · Acabamento: [Cód. 6] Ouro Light · Qtd: 100 un
```

Não existe nenhum campo livre de observação, nota ou instrução. A solicitação é 100% técnica: referência, partes, cores, tipo e quantidade.

## Regras de quantidade

Configuradas em `REGRAS`, no topo do componente:

| Tipo | Mínimo | Passo do +/− |
|---|---|---|
| Amostra | 10 peças (inicia em 10; abaixo disso bloqueia e alerta) | 1 |
| Pedido de Produção | 100 peças | 50 |

## Importação no ERP (SJSYS), espelho em PDF e Meus Pedidos

### Banco (Supabase)

Rode no SQL Editor, nesta ordem (os dois scripts podem ser executados de novo sem problema):

1. `supabase/migrations/20261022120000_pedidos_erp_retencao.sql`: tabelas `codigos_itens_cliente`, `pedidos` e `itens_pedido` (com `ON DELETE CASCADE`), RLS por representante, função `obter_ou_criar_codigo_item` e a purga diária de pedidos com mais de 30 dias via `pg_cron`.
2. `supabase/migrations/20261022150000_registrar_pedido_sjsys.sql`: número sequencial do pedido (`numero_seq`) e a função `registrar_pedido`, que grava cabeçalho e itens numa transação e amarra o código de cada item.

3. `supabase/migrations/20261023120000_clientes.sql`: tabela permanente `clientes` (fora da purga de 30 dias), compartilhada entre os representantes, e nova versão de `registrar_pedido`, que devolve `cliente_novo` e marca `ultimo_pedido_em`.

4. `supabase/migrations/20261023150000_pedido_sem_tipo_misto.sql`: o tipo do pedido passa a ser só `amostra` ou `producao`.

Com login real, a lista de clientes vem da tabela `clientes` e o cadastro grava direto nela (CNPJ só com dígitos, único). Se o banco falhar no cadastro, o cliente fica no aparelho e entra na tabela no 1º pedido. Cliente novo é quem ainda não tem `ultimo_pedido_em`: só ele leva os dados cadastrais no e-mail.

5. `supabase/migrations/20261023180000_chave_item_normalizada.sql`: o banco normaliza a chave (espaços extras e em volta da `/`) e converte as chaves já gravadas, mantendo os códigos.

O de-para usa o CNPJ (só dígitos) e a chave `REF|COR|AFRA`, ou `REF|COR|AFRA|ELOS|PONTEIRA` nas correntes:

- **REF:** maiúsculas, sem espaços extras.
- **COR:** nome do acabamento em maiúsculas e sem acento; bicolor no padrão `COR_CIMA/COR_BAIXO`.
- **AFRA:** o número, ou `sem-afra`.
- **Corrente:** `45elos` e `com-ponteira`/`sem-ponteira`.
- **Tipo:** não entra; amostra e produção da mesma peça têm o mesmo código.

Exemplos: `EF 661|OURO LIGHT|901`, `EF 1170|OURO LIGHT/PRETO|sem-afra`, `CR 101|NIQUEL|sem-afra|45elos|com-ponteira`. Os códigos não são apagados pela purga.

Sem Supabase (ou no acesso de demonstração), a numeração e o de-para ficam guardados no próprio aparelho.

### Quem gera o arquivo de importação

`REPS_IMPORTACAO` lista os e-mails liberados. Para eles, ao confirmar o envio, o app baixa automaticamente:

- `PedC[NUMERO]_[CNPJ].txt`: layout SJSYS V0002, campos separados por `#`, cada linha terminada em `#` e CRLF, UTF-8.

  ```
  PEDIDOCOMPRA#[RAZAO]#[FANTASIA]#[CNPJ]#[DD/MM/AAAA HH:MM:SS] - [CNPJ]#SJSYS SOFTWARE#V0002#
  HEADER#[NUMERO]#[EMISSAO]#30#[ENTREGA]#0,00#[OBS]#0,00#
  ITEM#0001#ENFEITE METALIZA EF 661 OURO LIGHT - AFRA 901#OURO LIGHT##10#0#1#
  ITEM#0002#CORRENTE METALIZA CR 101 NÍQUEL · 45 ELOS COM PONTEIRA#NÍQUEL##100#0#2#
  ```

  `OBS` sai `AMOSTRA` ou vazio (produção).
- `Pedido_[NUMERO]_[CLIENTE].pdf`: espelho A4 (jsPDF + autoTable) com cliente, representante, itens e totais. Colunas: Item, Código, Referência, Descrição (Afra ou "Sem Afra" em Enfeites/Fivelas; elos e ponteira na corrente), Acabamento / Cor e Quantidade. O PDF não menciona o SJSYS.

Os demais representantes baixam só o PDF (sem o TXT). O PDF fica disponível para todos em Meus Pedidos.

### Um tipo por solicitação

Cada solicitação é 100% Amostra ou 100% Pedido de Produção:

- **Na peça:** com carrinho em andamento, o tipo já vem no tipo dos itens, o outro fica desabilitado e aparece "Carrinho em andamento com itens de Amostra/Produção".
- **Na adição:** um item do outro tipo é recusado, com aviso. Isso vale também no modo apresentação, quando o cliente escolhido já tem carrinho do outro tipo.

### E-mail ao PCP

O corpo traz só o pedido e o cliente, sem lista de peças e sem texto sobre anexos:

```
SOLICITAÇÃO #0002 — TIPO: AMOSTRA
Data: 22/10/2026
Representante: Carlos Mendes (REP-014)

Cliente: Bella Passo Indústria de Calçados Ltda. (CNPJ: 12.847.365/0001-35)
```

- **Tipo:** `AMOSTRA` ou `PEDIDO DE PRODUÇÃO`, também no assunto: `[Pedido #0002 · AMOSTRA] Calçados Bella Passo · 1 item · 10 un`.
- **Cliente novo** (sem pedido anterior): no lugar da linha `Cliente:`, vai o bloco `DADOS CADASTRAIS (CLIENTE NOVO)` com razão social, fantasia, CNPJ, IE, endereço, CEP, cidade/UF, contato, telefone e e-mail.

## Catálogo do Supabase (tabela `produtos`)

Ao abrir o app (e de novo após o login), o catálogo vem da tabela `produtos`: `select("*").eq("ativo", true).order("ref")`, em lotes de 1.000 com `.range()`. A lista fica no estado `produtos` do App; vitrine, filtros de categoria, contadores, busca e menu lateral usam essa lista.

- **Ordem:** pela referência, com números em ordem natural (`FV 2` antes de `FV 10`).
- **Categoria:** normalizada para o plural dos filtros (`FIVELA`, `fivelas` → `Fivelas`); categorias novas no banco ganham filtro próprio.
- **Fotos:** caminho no bucket `produtos` (ou URL completa). Sem foto, ou se a foto não carregar, o card mostra a referência centralizada ("Foto em breve") sem quebrar o layout.
- **Sem Supabase, com erro ou com a tabela vazia:** vale o catálogo de demonstração.
- **Abertura:** o primeiro lançamento em vigor que tenha peças; sem nenhum, o Catálogo Geral.

## Painel de Cadastro (Admin)

No menu lateral, **Painel de Cadastro (Admin)** aparece para quem tem `app_metadata.role = "admin"` no Supabase Auth e, nesta fase de testes, para o usuário Demo (`carlos.mendes@metaliza.com.br`).

- **Nova Cor / Acabamento:** nome completo (ex.: `293 OURO LIGHT / 228 PRETO`). O app identifica sozinho os códigos e se é Solo ou Bicolor, recusa nome sem código e cor já existente (mesmo nome ou mesmos códigos) e grava em `cores` (`nome`, `codigos`, `bicolor`, `ativo`).
- **Nova Peça:** referência, categoria, coleção (Linha permanente ou lançamento) e foto opcional (JPG/PNG/WEBP até 5 MB, enviada ao bucket `produtos`). Recusa referência repetida. A peça aparece no catálogo na hora.

- **Nova Coleção:** nome, data de lançamento (padrão hoje) e validade em dias (padrão 90). Seleção das peças ativas com busca por referência, "Selecionar todas" (respeita o filtro), "Limpar seleção" e contador. "Lançar Coleção" só habilita com nome e ao menos uma peça e passa por duas confirmações ("Confirmar Lançamento de Coleção" e "⚠️ Tem certeza absoluta?"). Grava em `colecoes` e muda `produtos.colecao` das peças marcadas; se nenhuma peça for atualizada, a coleção criada é desfeita. A coleção entra na hora no menu lateral, com o contador de dias.

As coleções em lançamento vêm da tabela `colecoes` (`ativa = true`), cada uma com a sua validade (`dias_validade`). Sem a tabela (ou vazia), vale o lançamento de demonstração.

**Segurança:** rode `supabase/migrations/20261024120000_painel_admin.sql` e depois `supabase/migrations/20261024150000_colecoes.sql`. Ele cria `eh_admin()` e as políticas que só deixam administradores gravarem em `cores`, `produtos` e no bucket `produtos`; a leitura continua liberada. O script também marca o usuário Demo como admin (crie-o antes em Authentication > Users). Esconder o botão no app não é a proteção: quem decide é o banco.

Sem login real no Supabase (botão de demonstração), o painel funciona só na sessão, sem gravar no banco.
