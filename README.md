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
     - Abre a seleção de cliente: 3 fábricas pré-cadastradas, seleção com 1 clique, e Cadastro Rápido (nome fantasia, contato/modelista, WhatsApp com máscara, cidade).
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
   - **Peças:** 7 referências reais em ABS. As fotos originais estão embutidas e aparecem inteiras (`object-contain`), sem cortes nem alteração de cor:

     | Grupo | Referências |
     |---|---|
     | Lançamento Verão 2026 | EF 661 (Enfeites), EF 1170 (Enfeites, Aro + Centro), PS 1030 (Passadores) |
     | Linha permanente | EF 1143 (Enfeites), EF 1150 (Enfeites), PS 1027 (Passadores), PS 057 (Passadores) |

   - **Categorias:** Enfeites, Fivelas, Passadores e Ponteiras.
   - **Filtros:** por categoria e por material-base, e busca por referência.

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

4. **Configuração da peça:** foto de referência em Ouro Light. Peça única tem um seletor, "Cor do Acabamento". Peça com duas partes (`bipartida: true` + `partes`) tem dois seletores independentes, como "Cor do Aro" e "Cor do Centro" na Ref. EF 1170. Enfeites e Fivelas têm o módulo de Afra. Depois vêm o tipo (Amostra ou Pedido de Produção) e a quantidade com mínimo.
5. **Pedido:** painel lateral agrupado em Amostras e Produção, com ajuste de quantidade e remoção. O pedido é guardado separadamente para cada cliente.
6. **Revisão e envio:** confirmação e número da solicitação. Depois vêm a simulação do e-mail para a fábrica (Para/Cc/Assunto/corpo) e o texto formatado para WhatsApp.

## Material-base e acabamentos

Todas as peças são ABS, um material fixo por referência. A foto é sempre a original e não muda com a cor selecionada. A cartela serve só para registrar a escolha técnica no pedido:

- **Banhos:** Ouro Light (padrão), Ouro 24k, Níquel, Ônix e Marrom. O pedido mantém ABS.
- **Efeitos especiais:**
  - **Efeito Aura:** reclassifica o material para Aura (`Material: Aura | Acabamento: Efeito Aura`).
  - **Policarbonato:** reclassifica o material para Policarbonato (`Material: Policarbonato | Acabamento: Cristal/Poli`).

Na EF 1170, aro e centro (cabochão) têm seletores independentes. Exemplo: `Aro: Ônix (ABS) | Centro: Efeito Aura (Aura)`.

## Regras técnicas do modal

- **Cores da cartela:** 6 Ouro Light (padrão), 1 Ouro 24k, 2 Níquel, 3 Ônix, 4 Marrom, 8 Efeito Aura e 9 Policarbonato. Cada botão mostra o código junto da cor.
- **Cor oculta:** 1554 Ouro Queimado não aparece na cartela.
  - Para selecionar, digite `1554` (ou "ouro queimado") no campo "Buscar cor por código ou nome".
  - A cor aparece como "Cor encontrada pelo código" e já fica selecionada.
  - Um nome que corresponde a várias cores, como "ouro", lista as opções em vez de escolher uma.
- **Afra:**
  - Aparece só em Enfeites e Fivelas. Não existe para Passadores e Ponteiras.
  - Opções "Sem Afra" (padrão) ou "Com Afra", com os códigos da Linha 800 (800–807) e da Linha 900 (901–907).
- **Peças com duas partes:** a Ref. EF 1170 tem seletores separados para Aro e Centro, sem nenhuma etiqueta extra.

## Identificação técnica

As peças não têm nome fantasia: o identificador é a referência, sempre em caixa alta com o prefixo `Ref.`.

- **Card:** mostra `Ref. EF 661` em destaque e, abaixo, `Enfeites • ABS`.
- **Modal:** o título é `Ref. EF 661` e o subtítulo é `Categoria: Enfeite | Material: ABS`.
- **Busca:** só por referência, sem diferenciar espaço ou caixa (`ef1170` encontra `EF 1170`).

O espelho do e-mail e do WhatsApp traz Representante, Cliente e Coleção, e depois as linhas abaixo, com cor e código:

```
Ref. EF 661 - Enfeite (ABS) | Acabamento: [1554] Ouro Queimado | Afra: 801 | Qtd: 10 un
Ref. EF 1170 - Enfeite (ABS) | Aro: [3] Ônix / Centro: [8] Efeito Aura (Aura) | Sem Afra | Qtd: 10 un
Ref. PS 1030 - Passador (ABS) | Acabamento: [6] Ouro Light | Qtd: 10 un
```

Não existe nenhum campo livre de observação, nota ou instrução. A solicitação é 100% técnica: referência, material, partes, cores, tipo e quantidade.

## Regras de quantidade

Configuradas em `REGRAS`, no topo do componente:

| Tipo | Mínimo | Passo do +/− |
|---|---|---|
| Amostra | 10 peças (inicia em 10; abaixo disso bloqueia e alerta) | 1 |
| Pedido de Produção | 100 peças | 50 |
