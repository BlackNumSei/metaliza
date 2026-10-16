# Metaliza · App do Representante

Protótipo interativo (React + Tailwind CSS, só com estado local) do fluxo comercial de uma empresa de cromagem/metalização de componentes para calçados femininos.

- **Componente único:** `src/MetalizaApp.jsx` (export default `MetalizaApp`). Ele usa apenas `react` e classes Tailwind. Os tokens de cor e as fontes vêm de um `<style>` interno, então não exige configuração extra do Tailwind.
- **Preview standalone:** `preview/index.html`, que abre direto no navegador (React e Tailwind via CDN). Para regenerar depois de editar o componente: `npm install && npm run preview:build`.

## Fluxo

1. **Login:** email/senha (`carlos.mendes@metaliza.com.br` / `demo123`) ou o botão "Entrar como Representante Demonstração".
2. **Cliente:** 3 fábricas pré-cadastradas, seleção com 1 clique, e Cadastro Rápido (nome fantasia, contato/modelista, WhatsApp com máscara, cidade).
3. **Catálogo técnico:** 13 referências; filtros por categoria e por substrato; busca por código ou nome.
4. **Configuração da peça:** foto de referência em Ouro Light; 5 acabamentos; Amostra ou Pedido de Produção; quantidade com mínimo; observação.
5. **Pedido:** painel lateral agrupado em Amostras e Produção, com ajuste de quantidade e remoção. O pedido é guardado separadamente para cada cliente.
6. **Revisão e envio:** confirmação, número da solicitação e resumo pronto para WhatsApp (copiar ou abrir `wa.me`).

## Regras de quantidade

Configuradas em `REGRAS`, no topo do componente:

| Tipo | Mínimo | Passo do +/− |
|---|---|---|
| Amostra | 10 peças (inicia em 10; abaixo disso bloqueia e alerta) | 1 |
| Pedido de Produção | 100 peças | 50 |
