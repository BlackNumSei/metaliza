# Metaliza · App do Representante

Protótipo interativo (React + Tailwind CSS, só com estado local) do fluxo comercial de uma empresa de cromagem/metalização de componentes para calçados femininos.

- **Componente único:** `src/MetalizaApp.jsx` (export default `MetalizaApp`). Ele usa apenas `react` e classes Tailwind. Os tokens de cor e as fontes vêm de um `<style>` interno, então não exige configuração extra do Tailwind.
- **Preview standalone:** `preview/index.html`, que abre direto no navegador (React e Tailwind via CDN). Para regenerar depois de editar o componente: `npm install && npm run preview:build`.

## Fluxo

1. **Login:** email/senha (`carlos.mendes@metaliza.com.br` / `demo123`) ou o botão "Entrar como Representante Demonstração".
2. **Cliente:** 3 fábricas pré-cadastradas, seleção com 1 clique, e Cadastro Rápido (nome fantasia, contato/modelista, WhatsApp com máscara, cidade).
3. **Catálogo técnico:** 3 peças reais. As fotos originais estão embutidas no componente e aparecem inteiras, com `object-contain`, sem cortes nem alteração de cor:
   - EF 661 (Enfeites, peça única);
   - EF 1170 (Enfeites, bipartida: aro + cabochão);
   - FV 24K (Fivelas).

   Tem filtros por categoria e por material-base, e busca por código ou nome.
4. **Configuração da peça:** foto de referência em Ouro Light. Peça única tem um seletor, "Cor do Acabamento". Peça bipartida (`bipartida: true`) tem dois seletores independentes, "Cor da Parte de Cima" e "Cor da Parte de Baixo". Depois vêm o tipo (Amostra ou Pedido de Produção) e a quantidade com mínimo.
5. **Pedido:** painel lateral agrupado em Amostras e Produção, com ajuste de quantidade e remoção. O pedido é guardado separadamente para cada cliente.
6. **Revisão e envio:** confirmação e número da solicitação. Depois vêm a simulação do e-mail para a fábrica (Para/Cc/Assunto/corpo) e o texto formatado para WhatsApp.

## Material-base e acabamentos

Todas as peças são ABS, um material fixo por referência. A foto é sempre a original e não muda com a cor selecionada. A cartela serve só para registrar a escolha técnica no pedido:

- **Banhos:** Ouro Light (padrão), Ouro 24k, Níquel, Ônix e Marrom. O pedido mantém ABS.
- **Efeitos especiais:**
  - **Efeito Aura:** reclassifica o material para Aura (`Material: Aura | Acabamento: Efeito Aura`).
  - **Policarbonato:** reclassifica o material para Policarbonato (`Material: Policarbonato | Acabamento: Cristal/Poli`).

Na EF 1170, aro e centro (cabochão) têm seletores independentes. Exemplo: `Aro: Ônix (ABS) | Centro: Efeito Aura (Aura)`.

Peças bipartidas aparecem com a tag "Peça Bipartida" no catálogo e no pedido. Nos resumos, as duas cores aparecem por extenso, por exemplo `Cima: Ouro Light | Baixo: Grafite/Ônix`.

Não existe nenhum campo livre de observação, nota ou instrução. A solicitação é 100% técnica: referência, material, partes, cores, tipo e quantidade.

## Regras de quantidade

Configuradas em `REGRAS`, no topo do componente:

| Tipo | Mínimo | Passo do +/− |
|---|---|---|
| Amostra | 10 peças (inicia em 10; abaixo disso bloqueia e alerta) | 1 |
| Pedido de Produção | 100 peças | 50 |
