import React, { useEffect, useId, useMemo, useState } from "react";

/* ------------------------------------------------------------------
   Metaliza · App do Representante
   Fluxo comercial completo (login → cliente → catálogo → configuração
   da peça → pedido → envio), simulado só com estado local.
   ------------------------------------------------------------------ */

// Regras de quantidade (fáceis de ajustar)
const REGRAS = {
  amostra: { min: 10, passo: 1, alerta: "Quantidade mínima de amostra: 10 peças." },
  producao: { min: 100, passo: 50, alerta: "Pedido de produção mínimo: 100 peças." },
};

const PRAZO = { amostra: "7 dias úteis", producao: "15 a 20 dias úteis" };

const REPRESENTANTE_DEMO = {
  nome: "Carlos Mendes",
  regiao: "Região Polo Calçadista",
  email: "carlos.mendes@metaliza.com.br",
  senha: "demo123",
  codigo: "REP-014",
};

const CLIENTES_INICIAIS = [
  {
    id: "c1",
    nome: "Calçados Bella Passo",
    contato: "Juliana Prates (modelista)",
    whatsapp: "(51) 99812-4410",
    cidade: "Novo Hamburgo/RS",
    ultimoPedido: "12/09/2026",
  },
  {
    id: "c2",
    nome: "Studio Valentina Shoes",
    contato: "Marcos Lemos (desenvolvimento)",
    whatsapp: "(16) 99734-2208",
    cidade: "Franca/SP",
    ultimoPedido: "28/08/2026",
  },
  {
    id: "c3",
    nome: "Ateliê Dona Flor Calçados",
    contato: "Renata Souza (modelista)",
    whatsapp: "(37) 99155-7821",
    cidade: "Nova Serrana/MG",
    ultimoPedido: null,
  },
];

const CATEGORIAS = ["Todos", "Enfeites", "Fivelas", "Ponteiras", "Passador", "Saltos", "Detalhe de salto"];
// Material-base de injeção: fixo por referência. Aura e Policarbonato são efeitos de acabamento.
const MATERIAIS = ["Todos", "ABS", "TPU", "PVC"];

const PRODUTOS = [
  { ref: "MZ-ENF-1042", nome: "Enfeite Laço Clássico", categoria: "Enfeites", material: "ABS", medida: "38 × 22 mm", forma: "laco", bipartida: true },
  { ref: "MZ-ENF-1187", nome: "Enfeite Corrente Elos", categoria: "Enfeites", material: "PVC", medida: "60 × 12 mm", forma: "corrente", bipartida: false },
  { ref: "MZ-ENF-1290", nome: "Enfeite Gota Facetada", categoria: "Enfeites", material: "TPU", medida: "18 × 26 mm", forma: "gota", bipartida: false },
  { ref: "MZ-FIV-2210", nome: "Fivela Quadrada 25 mm", categoria: "Fivelas", material: "ABS", medida: "25 × 25 mm", forma: "fivelaQuadrada", bipartida: false },
  { ref: "MZ-FIV-2315", nome: "Fivela Oval Vazada 18 mm", categoria: "Fivelas", material: "PVC", medida: "28 × 18 mm", forma: "fivelaOval", bipartida: false },
  { ref: "MZ-PON-3104", nome: "Ponteira Bico Fino", categoria: "Ponteiras", material: "TPU", medida: "42 × 30 mm", forma: "ponteiraFina", bipartida: false },
  { ref: "MZ-PON-3120", nome: "Ponteira Quadrada", categoria: "Ponteiras", material: "ABS", medida: "40 × 34 mm", forma: "ponteiraQuadrada", bipartida: false },
  { ref: "MZ-PAS-4402", nome: "Passador Barra Lisa 30 mm", categoria: "Passador", material: "PVC", medida: "30 × 8 mm", forma: "passadorBarra", bipartida: false },
  { ref: "MZ-PAS-4480", nome: "Passador Argola Dupla", categoria: "Passador", material: "ABS", medida: "34 × 16 mm", forma: "passadorArgola", bipartida: false },
  { ref: "MZ-SAL-5501", nome: "Salto Taça 7 cm", categoria: "Saltos", material: "ABS", medida: "70 mm · base 14 mm", forma: "saltoTaca", bipartida: true },
  { ref: "MZ-SAL-5630", nome: "Salto Bloco 5 cm", categoria: "Saltos", material: "ABS", medida: "50 mm · base 32 mm", forma: "saltoBloco", bipartida: false },
  { ref: "MZ-DTS-6012", nome: "Capa de Salto Anel", categoria: "Detalhe de salto", material: "TPU", medida: "Ø 16 × 9 mm", forma: "anel", bipartida: true },
  { ref: "MZ-DTS-6045", nome: "Friso de Salto Canelado", categoria: "Detalhe de salto", material: "PVC", medida: "48 × 10 mm", forma: "friso", bipartida: false },
];

const ACABAMENTOS = [
  // Banhos tradicionais: mantêm o material-base da peça
  { id: "ouro-light", nome: "Ouro Light", grupo: "banho", cores: ["#FBF0C6", "#E3C16B", "#B38A33", "#7A5A1C"] },
  { id: "niquel", nome: "Níquel", grupo: "banho", cores: ["#FAFBFC", "#C9CED3", "#8C949B", "#555B61"] },
  { id: "grafite", nome: "Grafite/Ônix", grupo: "banho", cores: ["#8A8E95", "#4A4E55", "#25272B", "#0E0F11"] },
  { id: "ouro-velho", nome: "Ouro Velho", grupo: "banho", cores: ["#E2C68A", "#AE8742", "#6E4F22", "#3D2A10"] },
  { id: "prata-velha", nome: "Prata Velha", grupo: "banho", cores: ["#E4E3DC", "#A5A49C", "#66655E", "#38372F"] },
  // Efeitos especiais: reclassificam o material da peça (ou da parte) no pedido
  { id: "aura", nome: "Efeito Aura", rotulo: "Efeito Aura", grupo: "efeito", material: "Aura", detalhe: "Perolado iridescente", cores: ["#FBEAF6", "#B9D6F4", "#E7C6EE", "#93D9C9"] },
  { id: "policarbonato", nome: "Policarbonato", rotulo: "Cristal/Poli", grupo: "efeito", material: "Policarbonato", detalhe: "Transparente/Cristal", opacidade: 0.6, cores: ["#FFFFFF", "#DDEBF3", "#B6CCDA", "#86A0B2"] },
];
const GRUPOS_ACABAMENTO = [
  { id: "banho", titulo: "Banhos tradicionais" },
  { id: "efeito", titulo: "Efeitos especiais" },
];
const ACABAMENTO_PADRAO = ACABAMENTOS[0];
const acabamentoPorId = (id) => ACABAMENTOS.find((a) => a.id === id) || ACABAMENTO_PADRAO;

const TIPO_LABEL = { amostra: "Amostra", producao: "Pedido de Produção" };

// Material que vai para o pedido: efeito especial reclassifica; banho mantém o material-base
const materialEfetivo = (produto, acabamentoId) => acabamentoPorId(acabamentoId).material || produto.material;
const rotuloAcabamento = (acabamentoId) => {
  const a = acabamentoPorId(acabamentoId);
  return a.rotulo || a.nome;
};

// Texto padronizado de material + acabamento de um item (peça única ou bipartida)
function textoAcabamento(produto, acabamento, acabamentoBaixo) {
  if (!produto.bipartida) return `Material: ${materialEfetivo(produto, acabamento)} | Acabamento: ${rotuloAcabamento(acabamento)}`;
  const parte = (id) => `${rotuloAcabamento(id)} (${materialEfetivo(produto, id)})`;
  return `Parte de Cima: ${parte(acabamento)} | Parte de Baixo: ${parte(acabamentoBaixo)}`;
}

// Resumo curto do material no pedido (para chips da interface)
function textoMaterial(produto, acabamento, acabamentoBaixo) {
  if (!produto.bipartida) return materialEfetivo(produto, acabamento);
  return `Cima: ${materialEfetivo(produto, acabamento)} · Baixo: ${materialEfetivo(produto, acabamentoBaixo)}`;
}

const EMAIL_PEDIDOS = "pedidos@metaliza.com.br";

/* ----------------------------- utilidades ----------------------------- */

const somenteDigitos = (s) => s.replace(/\D/g, "");

function mascaraWhatsapp(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const formatarNumero = (n) => n.toLocaleString("pt-BR");

function hojeFormatado() {
  return new Date().toLocaleDateString("pt-BR");
}

function gerarNumeroPedido(seq) {
  const ano = new Date().getFullYear();
  return `PV-${ano}-${String(4180 + seq).padStart(5, "0")}`;
}

function linhasItens(itens, negrito) {
  const b = (t) => (negrito ? `*${t}*` : t);
  const linhas = [];
  ["amostra", "producao"].forEach((tipo) => {
    const grupo = itens.filter((i) => i.tipo === tipo);
    if (!grupo.length) return;
    linhas.push("");
    linhas.push(`${b(tipo === "amostra" ? "AMOSTRAS" : "PRODUÇÃO")} (prazo estimado ${PRAZO[tipo]})`);
    grupo.forEach((i) => {
      const p = PRODUTOS.find((x) => x.ref === i.ref);
      linhas.push(`• Ref. ${i.ref} ${p.nome} | ${p.bipartida ? "Bipartida | " : ""}${textoAcabamento(p, i.acabamento, i.acabamentoBaixo)} | ${formatarNumero(i.qtd)} pçs`);
    });
  });
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  linhas.push("");
  linhas.push(`Total: ${formatarNumero(total)} peças em ${itens.length} ${itens.length === 1 ? "item" : "itens"}`);
  return linhas;
}

function montarMensagem({ numero, rep, cliente, itens }) {
  return [
    `*Metaliza · Solicitação ${numero}*`,
    `Data: ${hojeFormatado()}`,
    `Cliente: ${cliente.nome} (${cliente.cidade})`,
    `Contato: ${cliente.contato}`,
    `Representante: ${rep.nome} · ${rep.regiao}`,
    ...linhasItens(itens, true),
  ].join("\n");
}

function montarEmail({ numero, rep, cliente, itens }) {
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  return {
    para: EMAIL_PEDIDOS,
    cc: rep.email,
    assunto: `[${numero}] ${cliente.nome} · ${itens.length} ${itens.length === 1 ? "item" : "itens"} · ${formatarNumero(total)} pçs`,
    corpo: [
      `Solicitação ${numero} registrada em ${hojeFormatado()}.`,
      "",
      `Cliente: ${cliente.nome}`,
      `Contato: ${cliente.contato}`,
      `WhatsApp: ${cliente.whatsapp}`,
      `Cidade: ${cliente.cidade}`,
      `Representante: ${rep.nome} (${rep.codigo}) · ${rep.regiao}`,
      ...linhasItens(itens, false),
    ].join("\n"),
  };
}

/* ----------------------------- estilos/tokens ----------------------------- */

const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
/* Layout: barra superior fixa + coluna central de trabalho (max 72rem); painel lateral do pedido. */
:root {
  --mz-bg: #F1F2EF;
  --mz-surface: #FFFFFF;
  --mz-sunken: #E7E8E4;
  --mz-ink: #1B1D20;
  --mz-muted: #5F646A;
  --mz-line: #D6D8D3;
  --mz-accent: #9A7020;
  --mz-accent-soft: #F3E7C8;
  --mz-on-accent: #FFFFFF;
  --mz-ok: #2F7D4F;
  --mz-ok-soft: #DCEFE3;
  --mz-warn: #A3401F;
  --mz-warn-soft: #F7E0D6;
  --mz-studio-a: #FBFBF9;
  --mz-studio-b: #E4E5E1;
  --mz-shadow: 0 1px 2px rgba(27,29,32,.06), 0 8px 24px -12px rgba(27,29,32,.18);
  --mz-display: 'Syne', 'Avenir Next', 'Segoe UI', sans-serif;
  --mz-body: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mz-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --mz-bg: #131416; --mz-surface: #1C1E21; --mz-sunken: #0E0F11; --mz-ink: #ECEBE6;
    --mz-muted: #9DA1A6; --mz-line: #2E3135; --mz-accent: #E0BC62; --mz-accent-soft: #3A3020;
    --mz-on-accent: #1B1606; --mz-ok: #7CCB98; --mz-ok-soft: #1F3328; --mz-warn: #F09A78;
    --mz-warn-soft: #3D2219; --mz-studio-a: #2A2C30; --mz-studio-b: #18191C;
    --mz-shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px -14px rgba(0,0,0,.7);
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --mz-bg: #131416; --mz-surface: #1C1E21; --mz-sunken: #0E0F11; --mz-ink: #ECEBE6;
  --mz-muted: #9DA1A6; --mz-line: #2E3135; --mz-accent: #E0BC62; --mz-accent-soft: #3A3020;
  --mz-on-accent: #1B1606; --mz-ok: #7CCB98; --mz-ok-soft: #1F3328; --mz-warn: #F09A78;
  --mz-warn-soft: #3D2219; --mz-studio-a: #2A2C30; --mz-studio-b: #18191C;
  --mz-shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px -14px rgba(0,0,0,.7);
  color-scheme: dark;
}
.mz-root { background: var(--mz-bg); color: var(--mz-ink); font-family: var(--mz-body); min-height: 100%; }
.mz-display { font-family: var(--mz-display); letter-spacing: -0.01em; text-wrap: balance; }
.mz-mono { font-family: var(--mz-mono); font-variant-numeric: tabular-nums; }
.mz-eyebrow { font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; color: var(--mz-muted); }
.mz-studio { background: radial-gradient(120% 90% at 50% 18%, var(--mz-studio-a) 0%, var(--mz-studio-b) 100%); }
.mz-gutter { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.mz-focus:focus-visible { outline: 2px solid var(--mz-accent); outline-offset: 2px; }
.mz-sheen { position: relative; overflow: hidden; }
.mz-sheen::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.35) 50%, transparent 65%); transform: translateX(-120%); transition: transform .9s ease; pointer-events: none; }
.mz-sheen:hover::after { transform: translateX(120%); }
@keyframes mz-in { from { opacity: .4; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.mz-in { animation: mz-in .22s ease-out; }
@keyframes mz-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.mz-shake { animation: mz-shake .25s ease-in-out 2; }
@media (prefers-reduced-motion: reduce) { .mz-in, .mz-shake { animation: none; } .mz-sheen::after { display: none; } }
`;

// Classes de cor reutilizadas (Tailwind com tokens CSS)
const C = {
  surface: "bg-[color:var(--mz-surface)]",
  sunken: "bg-[color:var(--mz-sunken)]",
  line: "border-[color:var(--mz-line)]",
  muted: "text-[color:var(--mz-muted)]",
  accentText: "text-[color:var(--mz-accent)]",
  btnPrimary:
    "mz-focus inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--mz-ink)] px-4 py-2.5 text-sm font-semibold text-[color:var(--mz-bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
  btnAccent:
    "mz-focus mz-sheen inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--mz-accent)] px-4 py-2.5 text-sm font-bold text-[color:var(--mz-on-accent)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40",
  btnGhost:
    "mz-focus inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--mz-ink)] transition hover:border-[color:var(--mz-ink)]",
  input:
    "mz-focus w-full rounded-md border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] px-3 py-2.5 text-sm text-[color:var(--mz-ink)] placeholder:text-[color:var(--mz-muted)]",
};

/* ----------------------------- imagem da peça ----------------------------- */

function FormaPeca({ forma, f }) {
  // f = id do gradiente metálico; s = id do gradiente de sombra/realce
  const fill = `url(#${f})`;
  const stroke = "rgba(0,0,0,.22)";
  switch (forma) {
    case "laco":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M100 100 C70 60 30 62 34 100 C30 138 70 140 100 100Z" fill={fill} />
          <path d="M100 100 C130 60 170 62 166 100 C170 138 130 140 100 100Z" fill={fill} />
          <path d="M92 106 L76 150 L90 146 L98 158 Z M108 106 L124 150 L110 146 L102 158 Z" fill={fill} />
          <rect x="88" y="86" width="24" height="28" rx="7" fill={fill} />
        </g>
      );
    case "corrente":
      return (
        <g fill="none" stroke={fill} strokeWidth="11">
          {[30, 72, 114, 156].map((x, i) => (
            <rect key={x} x={x - 22} y={i % 2 ? 84 : 78} width="44" height={i % 2 ? 32 : 44} rx={i % 2 ? 16 : 22} />
          ))}
        </g>
      );
    case "gota":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M100 34 C122 72 146 98 146 124 C146 152 125 170 100 170 C75 170 54 152 54 124 C54 98 78 72 100 34Z" fill={fill} />
          <path d="M100 34 L100 170 M54 124 L146 124 M100 34 L72 124 L100 170 L128 124 Z" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.4" />
        </g>
      );
    case "fivelaQuadrada":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path fillRule="evenodd" d="M44 44 h112 a14 14 0 0 1 14 14 v84 a14 14 0 0 1 -14 14 h-112 a14 14 0 0 1 -14 -14 v-84 a14 14 0 0 1 14 -14Z M58 64 v72 h84 v-72Z" fill={fill} />
          <rect x="94" y="56" width="12" height="96" rx="6" fill={fill} transform="rotate(-8 100 104)" />
        </g>
      );
    case "fivelaOval":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path fillRule="evenodd" d="M100 46 a74 54 0 1 0 0.1 0Z M100 68 a50 32 0 1 1 -0.1 0Z" fill={fill} />
          <rect x="22" y="96" width="156" height="9" rx="4.5" fill={fill} />
        </g>
      );
    case "ponteiraFina":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M40 70 C90 66 140 78 172 100 C140 122 90 134 40 130 C50 112 50 88 40 70Z" fill={fill} />
          <path d="M60 84 C100 82 132 90 150 100" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "ponteiraQuadrada":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M40 62 H140 C158 62 166 72 166 84 V116 C166 128 158 138 140 138 H40 C50 116 50 84 40 62Z" fill={fill} />
          <path d="M60 78 H138" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "passadorBarra":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path fillRule="evenodd" d="M36 78 h128 a12 12 0 0 1 12 12 v20 a12 12 0 0 1 -12 12 h-128 a12 12 0 0 1 -12 -12 v-20 a12 12 0 0 1 12 -12Z M48 94 v12 h104 v-12Z" fill={fill} />
        </g>
      );
    case "passadorArgola":
      return (
        <g fill="none" stroke={fill} strokeWidth="13">
          <ellipse cx="76" cy="100" rx="40" ry="34" />
          <ellipse cx="124" cy="100" rx="40" ry="34" />
        </g>
      );
    case "saltoTaca":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M58 30 H150 C146 60 120 80 112 112 C108 132 110 152 114 172 H92 C94 150 92 128 84 108 C74 82 60 62 58 30Z" fill={fill} />
          <rect x="88" y="166" width="30" height="8" rx="3" fill="rgba(0,0,0,.55)" stroke="none" />
        </g>
      );
    case "saltoBloco":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <path d="M50 46 H152 C150 90 146 130 142 158 H66 C62 130 56 90 50 46Z" fill={fill} />
          <rect x="64" y="154" width="80" height="9" rx="3" fill="rgba(0,0,0,.55)" stroke="none" />
          <path d="M70 60 C72 100 76 130 80 150" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "anel":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <ellipse cx="100" cy="118" rx="58" ry="20" fill={fill} />
          <rect x="42" y="78" width="116" height="40" fill={fill} stroke="none" />
          <ellipse cx="100" cy="78" rx="58" ry="20" fill={fill} />
          <ellipse cx="100" cy="78" rx="40" ry="12" fill="rgba(0,0,0,.4)" stroke="none" />
        </g>
      );
    case "friso":
      return (
        <g stroke={stroke} strokeWidth="1.2">
          <rect x="30" y="80" width="140" height="40" rx="8" fill={fill} />
          {[48, 66, 84, 102, 120, 138, 156].map((x) => (
            <line key={x} x1={x} y1="84" x2={x} y2="116" stroke="rgba(0,0,0,.28)" strokeWidth="3" />
          ))}
        </g>
      );
    default:
      return <circle cx="100" cy="100" r="50" fill={fill} />;
  }
}

function ImagemPeca({ produto, acabamento = ACABAMENTO_PADRAO, acabamentoBaixo = null, className = "", rotulo = true }) {
  const uid = useId().replace(/:/g, "");
  const gid = `mz-g-${uid}`;
  const baixo = produto.bipartida ? acabamentoBaixo || acabamento : null;
  const gradiente = (id, a) => {
    const [c1, c2, c3, c4] = a.cores;
    return (
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c1} />
        <stop offset="0.35" stopColor={c2} />
        <stop offset="0.55" stopColor={c1} />
        <stop offset="0.78" stopColor={c3} />
        <stop offset="1" stopColor={c4} />
      </linearGradient>
    );
  };
  const nome = baixo && baixo.id !== acabamento.id ? `${acabamento.nome} / ${baixo.nome}` : acabamento.nome;
  return (
    <div className={`mz-studio relative flex aspect-square w-full max-w-full items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 200" className="h-4/5 w-4/5 drop-shadow-[0_10px_12px_rgba(0,0,0,0.22)]" role="img" aria-label={`${produto.nome} em ${nome}`}>
        <defs>
          {gradiente(gid, acabamento)}
          {baixo && gradiente(`${gid}-b`, baixo)}
          {baixo && (
            <>
              <clipPath id={`${gid}-cima`}><rect x="0" y="0" width="200" height="100" /></clipPath>
              <clipPath id={`${gid}-baixo`}><rect x="0" y="100" width="200" height="100" /></clipPath>
            </>
          )}
        </defs>
        <ellipse cx="100" cy="182" rx="62" ry="6" fill="rgba(0,0,0,.12)" />
        {baixo ? (
          <>
            <g clipPath={`url(#${gid}-cima)`} opacity={acabamento.opacidade || 1}><FormaPeca forma={produto.forma} f={gid} /></g>
            <g clipPath={`url(#${gid}-baixo)`} opacity={baixo.opacidade || 1}><FormaPeca forma={produto.forma} f={`${gid}-b`} /></g>
            <line x1="14" y1="100" x2="186" y2="100" stroke="rgba(0,0,0,.35)" strokeWidth="1" strokeDasharray="3 3" />
          </>
        ) : (
          <g opacity={acabamento.opacidade || 1}><FormaPeca forma={produto.forma} f={gid} /></g>
        )}
      </svg>
      {rotulo && (
        <span className="mz-mono absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          {nome}
        </span>
      )}
    </div>
  );
}

function SwatchesItem({ produto, acabamento, acabamentoBaixo, size }) {
  return (
    <span className="inline-flex shrink-0 -space-x-1">
      <Swatch acabamento={acabamentoPorId(acabamento)} size={size} />
      {produto.bipartida && <Swatch acabamento={acabamentoPorId(acabamentoBaixo)} size={size} />}
    </span>
  );
}

function TagBipartida({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border border-dashed border-[color:var(--mz-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--mz-accent)] ${className}`}>
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
        <rect x="1.5" y="1.5" width="9" height="4" rx="1" fill="currentColor" />
        <rect x="1.5" y="6.5" width="9" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      Peça Bipartida
    </span>
  );
}

function Swatch({ acabamento, size = "h-9 w-9" }) {
  const [c1, c2, c3, c4] = acabamento.cores;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/15 ${size}`}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 40%, ${c1} 55%, ${c3} 80%, ${c4} 100%)` }}
    />
  );
}

/* ----------------------------- ícones ----------------------------- */

const Icone = {
  sacola: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  ),
  busca: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" />
    </svg>
  ),
  fechar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  mais: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  menos: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
  alerta: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  ),
  voltar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  ),
  lixeira: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
    </svg>
  ),
};

/* ----------------------------- tela 1: login ----------------------------- */

function TelaLogin({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe email e senha para entrar.");
      return;
    }
    if (email.trim().toLowerCase() !== REPRESENTANTE_DEMO.email || senha !== REPRESENTANTE_DEMO.senha) {
      setErro("Email ou senha não conferem. Use o acesso de demonstração abaixo.");
      return;
    }
    onEntrar(REPRESENTANTE_DEMO);
  };

  return (
    <div className="mz-gutter flex min-h-screen items-center justify-center py-10">
      <div className="mz-in grid w-full max-w-4xl overflow-hidden rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] shadow-[var(--mz-shadow)] md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-[color:var(--mz-sunken)] p-8 md:flex">
          <div>
            <p className="mz-eyebrow">Galvanoplastia para calçados femininos</p>
            <h1 className="mz-display mt-3 text-4xl font-extrabold leading-none">METALIZA</h1>
            <p className={`mt-3 max-w-xs text-sm ${C.muted}`}>
              Catálogo técnico, amostras e pedidos de produção na palma da mão do representante.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[PRODUTOS[0], PRODUTOS[3], PRODUTOS[9]].map((p, i) => (
              <ImagemPeca key={p.ref} produto={p} acabamento={ACABAMENTOS[[0, 1, 3][i]]} rotulo={false} className="rounded-lg" />
            ))}
          </div>
          <div className="flex gap-2">
            {ACABAMENTOS.map((a) => (
              <Swatch key={a.id} acabamento={a} size="h-5 w-5" />
            ))}
          </div>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-5 p-6 sm:p-8" noValidate>
          <div>
            <p className="mz-display text-2xl font-extrabold md:hidden">METALIZA</p>
            <h2 className="mz-display mt-1 text-xl font-bold">Acesso do representante</h2>
            <p className={`mt-1 text-sm ${C.muted}`}>Entre com seu email corporativo.</p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor="mz-login-email">
            Email
            <input id="mz-login-email" type="email" autoComplete="username" className={C.input} placeholder="nome@metaliza.com.br" value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor="mz-login-senha">
            Senha
            <input id="mz-login-senha" type="password" autoComplete="current-password" className={C.input} placeholder="••••••" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} />
          </label>

          {erro && (
            <p role="alert" className="flex items-start gap-2 rounded-md bg-[color:var(--mz-warn-soft)] px-3 py-2 text-sm text-[color:var(--mz-warn)]">
              <Icone.alerta className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
            </p>
          )}

          <button type="submit" className={C.btnPrimary}>Entrar</button>

          <div className={`flex items-center gap-3 text-xs ${C.muted}`}>
            <span className="h-px flex-1 bg-[color:var(--mz-line)]" /> ou <span className="h-px flex-1 bg-[color:var(--mz-line)]" />
          </div>

          <button type="button" onClick={() => onEntrar(REPRESENTANTE_DEMO)} className={C.btnAccent}>
            Entrar como Representante Demonstração
          </button>
          <p className={`text-xs ${C.muted}`}>
            Demonstração: <span className="mz-mono">{REPRESENTANTE_DEMO.email}</span> · senha <span className="mz-mono">{REPRESENTANTE_DEMO.senha}</span>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ----------------------------- cabeçalho ----------------------------- */

function Cabecalho({ rep, cliente, qtdItens, onTrocarCliente, onSair, onAbrirPedido }) {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-[color:var(--mz-line)] bg-[color:var(--mz-surface)]">
      <div className="mz-gutter mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <span className="mz-display text-lg font-extrabold tracking-tight">METALIZA</span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--mz-accent-soft)] text-xs font-bold text-[color:var(--mz-accent)]">
            {rep.nome.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{rep.nome}</p>
            <p className={`truncate text-xs ${C.muted}`}>{rep.regiao}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {cliente && (
            <button type="button" onClick={onTrocarCliente} className="mz-focus hidden max-w-[16rem] items-center gap-2 rounded-md border border-[color:var(--mz-line)] px-3 py-1.5 text-left sm:flex" title="Trocar cliente">
              <span className="min-w-0 leading-tight">
                <span className="mz-eyebrow block text-[10px]">Atendendo</span>
                <span className="block truncate text-sm font-semibold">{cliente.nome}</span>
              </span>
            </button>
          )}
          {cliente && (
            <button type="button" onClick={onAbrirPedido} className="mz-focus relative inline-flex items-center gap-2 rounded-md bg-[color:var(--mz-ink)] px-3 py-2 text-sm font-semibold text-[color:var(--mz-bg)]">
              <Icone.sacola className="h-4 w-4" />
              Pedido
              {qtdItens > 0 && (
                <span className="mz-mono rounded-full bg-[color:var(--mz-accent)] px-1.5 text-[11px] font-bold text-[color:var(--mz-on-accent)]">{qtdItens}</span>
              )}
            </button>
          )}
          <button type="button" onClick={onSair} className={`mz-focus rounded-md px-2 py-2 text-sm font-semibold ${C.muted} hover:text-[color:var(--mz-ink)]`}>
            Sair
          </button>
        </div>
      </div>
      {cliente && (
        <div className="mz-gutter border-t border-[color:var(--mz-line)] py-2 sm:hidden">
          <button type="button" onClick={onTrocarCliente} className="mz-focus flex w-full items-center justify-between text-left text-sm">
            <span className="min-w-0 truncate"><span className={C.muted}>Atendendo: </span><b>{cliente.nome}</b></span>
            <span className={`shrink-0 text-xs font-semibold ${C.accentText}`}>Trocar</span>
          </button>
        </div>
      )}
    </header>
  );
}

/* ----------------------------- tela 2: clientes ----------------------------- */

function TelaClientes({ clientes, historico, onSelecionar, onCadastrar }) {
  const [abrirCadastro, setAbrirCadastro] = useState(false);
  const [form, setForm] = useState({ nome: "", contato: "", whatsapp: "", cidade: "" });
  const [erros, setErros] = useState({});

  const salvar = (e) => {
    e.preventDefault();
    const novos = {};
    if (!form.nome.trim()) novos.nome = "Informe o nome fantasia.";
    if (!form.contato.trim()) novos.contato = "Informe o contato ou modelista.";
    if (somenteDigitos(form.whatsapp).length < 10) novos.whatsapp = "WhatsApp com DDD, ex.: (51) 99999-0000.";
    if (!form.cidade.trim()) novos.cidade = "Informe a cidade.";
    setErros(novos);
    if (Object.keys(novos).length) return;
    onCadastrar({ id: `c${Date.now()}`, ...form, nome: form.nome.trim(), contato: form.contato.trim(), cidade: form.cidade.trim(), ultimoPedido: null, novo: true });
  };

  const campo = (chave, rotulo, placeholder, extra = {}) => (
    <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`mz-cli-${chave}`}>
      {rotulo}
      <input
        id={`mz-cli-${chave}`}
        className={`${C.input} ${erros[chave] ? "border-[color:var(--mz-warn)]" : ""}`}
        placeholder={placeholder}
        value={form[chave]}
        onChange={(e) => {
          const v = chave === "whatsapp" ? mascaraWhatsapp(e.target.value) : e.target.value;
          setForm((f) => ({ ...f, [chave]: v }));
          setErros((er) => ({ ...er, [chave]: undefined }));
        }}
        {...extra}
      />
      {erros[chave] && <span className="text-xs font-medium text-[color:var(--mz-warn)]">{erros[chave]}</span>}
    </label>
  );

  return (
    <main className="mz-gutter mx-auto max-w-6xl py-8">
      <div className="mz-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mz-eyebrow">Passo 1 de 3 · Cliente</p>
          <h1 className="mz-display mt-1 text-2xl font-bold sm:text-3xl">Para qual fábrica é este atendimento?</h1>
          <p className={`mt-1 text-sm ${C.muted}`}>O catálogo abre depois que você escolhe o cliente.</p>
        </div>
        <button type="button" onClick={() => setAbrirCadastro((v) => !v)} className={C.btnGhost} aria-expanded={abrirCadastro}>
          <Icone.mais className="h-4 w-4" /> Cadastro Rápido de Novo Cliente
        </button>
      </div>

      {abrirCadastro && (
        <form onSubmit={salvar} noValidate className="mz-in mt-6 rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5 shadow-[var(--mz-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="mz-display text-lg font-bold">Novo cliente</h2>
            <button type="button" onClick={() => setAbrirCadastro(false)} className={`mz-focus rounded p-1 ${C.muted}`} aria-label="Fechar cadastro">
              <Icone.fechar className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {campo("nome", "Nome fantasia", "Ex.: Calçados Lírio")}
            {campo("contato", "Contato / Modelista", "Ex.: Ana Paula (modelista)")}
            {campo("whatsapp", "WhatsApp", "(00) 00000-0000", { inputMode: "tel" })}
            {campo("cidade", "Cidade", "Ex.: Sapiranga/RS")}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setAbrirCadastro(false)} className={C.btnGhost}>Cancelar</button>
            <button type="submit" className={C.btnAccent}>Salvar e atender este cliente</button>
          </div>
        </form>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c) => {
          const enviados = historico.filter((h) => h.clienteId === c.id).length;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelecionar(c)}
                className="mz-focus group flex h-full w-full flex-col gap-4 rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--mz-accent)] hover:shadow-[var(--mz-shadow)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="mz-display flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color:var(--mz-sunken)] text-base font-bold">
                    {c.nome.split(" ").filter((p) => p.length > 2).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  {c.novo ? (
                    <span className="rounded-full bg-[color:var(--mz-accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--mz-accent)]">Novo cadastro</span>
                  ) : (
                    enviados > 0 && <span className="rounded-full bg-[color:var(--mz-ok-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--mz-ok)]">{enviados} enviado{enviados > 1 ? "s" : ""} hoje</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold">{c.nome}</p>
                  <p className={`mt-0.5 text-sm ${C.muted}`}>{c.contato}</p>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-[color:var(--mz-line)] pt-3 text-xs">
                  <div>
                    <dt className={C.muted}>Cidade</dt>
                    <dd className="font-semibold">{c.cidade}</dd>
                  </div>
                  <div>
                    <dt className={C.muted}>WhatsApp</dt>
                    <dd className="mz-mono font-semibold">{c.whatsapp}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={C.muted}>Último pedido</dt>
                    <dd className="font-semibold">{c.ultimoPedido || "Primeiro atendimento"}</dd>
                  </div>
                </dl>
                <span className={`text-sm font-bold ${C.accentText}`}>Atender este cliente →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/* ----------------------------- tela 3: catálogo ----------------------------- */

function Chips({ titulo, opcoes, valor, onChange, idBase }) {
  return (
    <div className="min-w-0">
      <p className="mz-eyebrow mb-2" id={`${idBase}-rotulo`}>{titulo}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${idBase}-rotulo`}>
        {opcoes.map((o) => {
          const ativo = o === valor;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onChange(o)}
              className={`mz-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                ativo
                  ? "border-[color:var(--mz-ink)] bg-[color:var(--mz-ink)] text-[color:var(--mz-bg)]"
                  : "border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] text-[color:var(--mz-ink)] hover:border-[color:var(--mz-ink)]"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TelaCatalogo({ cliente, itensPedido, onAbrirPeca }) {
  const [categoria, setCategoria] = useState("Todos");
  const [material, setMaterial] = useState("Todos");
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return PRODUTOS.filter(
      (p) =>
        (categoria === "Todos" || p.categoria === categoria) &&
        (material === "Todos" || p.material === material) &&
        (!termo || p.ref.toLowerCase().includes(termo) || p.nome.toLowerCase().includes(termo))
    );
  }, [categoria, material, busca]);

  const refsNoPedido = useMemo(() => new Set(itensPedido.map((i) => i.ref)), [itensPedido]);
  const limpar = () => { setCategoria("Todos"); setMaterial("Todos"); setBusca(""); };
  const filtrosAtivos = categoria !== "Todos" || material !== "Todos" || busca;

  return (
    <main className="mz-gutter mx-auto max-w-6xl pb-24 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mz-eyebrow">Passo 2 de 3 · Catálogo técnico</p>
          <h1 className="mz-display mt-1 text-2xl font-bold sm:text-3xl">Peças para {cliente.nome}</h1>
          <p className={`mt-1 text-sm ${C.muted}`}>Fotos de referência em Ouro Light. Banho ou efeito especial é escolhido ao abrir a peça.</p>
        </div>
        <label htmlFor="mz-busca" className="relative w-full sm:w-80">
          <span className="sr-only">Buscar por referência ou nome</span>
          <Icone.busca className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${C.muted}`} />
          <input id="mz-busca" type="search" className={`${C.input} pl-9`} placeholder="Buscar ref. (MZ-FIV-2210) ou nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-4 lg:grid-cols-[1.6fr_1fr]">
        <Chips titulo="Categoria" opcoes={CATEGORIAS} valor={categoria} onChange={setCategoria} idBase="mz-cat" />
        <Chips titulo="Material-base (injeção)" opcoes={MATERIAIS} valor={material} onChange={setMaterial} idBase="mz-mat" />
      </div>

      <div className={`mt-5 flex items-center justify-between text-sm ${C.muted}`}>
        <span><b className="text-[color:var(--mz-ink)]">{filtrados.length}</b> de {PRODUTOS.length} referências</span>
        {filtrosAtivos && <button type="button" onClick={limpar} className={`mz-focus font-semibold ${C.accentText}`}>Limpar filtros</button>}
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[color:var(--mz-line)] p-10 text-center">
          <p className="font-semibold">Nenhuma peça com esses filtros.</p>
          <p className={`mt-1 text-sm ${C.muted}`}>Tente outra categoria, outro material ou confira o código da referência.</p>
          <button type="button" onClick={limpar} className={`${C.btnGhost} mt-4`}>Limpar filtros</button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((p) => (
            <li key={p.ref} className="min-w-0">
              <button
                type="button"
                onClick={() => onAbrirPeca(p)}
                className="mz-focus group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] text-left transition hover:border-[color:var(--mz-accent)] hover:shadow-[var(--mz-shadow)]"
              >
                <div className="relative">
                  <ImagemPeca produto={p} className="transition duration-300 group-hover:scale-[1.03]" />
                  {refsNoPedido.has(p.ref) && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--mz-ok)] px-2 py-0.5 text-[10px] font-bold text-white">
                      <Icone.check className="h-3 w-3" /> No pedido
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className={`mz-mono text-xs font-semibold ${C.accentText}`}>{p.ref}</p>
                  <p className="text-sm font-bold leading-snug">{p.nome}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <span className="rounded border border-[color:var(--mz-ink)] px-1.5 py-0.5 text-[11px] font-bold" title="Material-base de injeção">{p.material}</span>
                    <span className="rounded bg-[color:var(--mz-sunken)] px-1.5 py-0.5 text-[11px] font-semibold">{p.categoria}</span>
                    {p.bipartida && <TagBipartida />}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/* ----------------------------- tela 4: modal da peça ----------------------------- */

function SeletorAcabamento({ titulo, valor, onChange, produto }) {
  const atual = acabamentoPorId(valor);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mz-eyebrow mb-3">
        {titulo} · <span className="text-[color:var(--mz-ink)]">{atual.nome}</span>
      </legend>
      {GRUPOS_ACABAMENTO.map((g) => (
        <div key={g.id}>
          <p className={`mb-1.5 text-[11px] font-semibold ${C.muted}`}>
            {g.titulo}
            {g.id === "banho" ? ` · mantém ${produto.material}` : " · reclassificam o material"}
          </p>
          <div className={`grid gap-2 ${g.id === "banho" ? "grid-cols-5" : "grid-cols-2"}`}>
            {ACABAMENTOS.filter((a) => a.grupo === g.id).map((a) => {
              const ativo = a.id === valor;
              const efeito = a.grupo === "efeito";
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onChange(a.id)}
                  aria-pressed={ativo}
                  aria-label={`${titulo}: ${a.nome}`}
                  className={`mz-focus flex min-w-0 items-center gap-2 rounded-lg border p-2 transition ${efeito ? "text-left" : "flex-col text-center"} ${
                    ativo ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)]" : "border-[color:var(--mz-line)] hover:border-[color:var(--mz-ink)]"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Swatch acabamento={a} size={efeito ? "h-9 w-9" : "h-10 w-10"} />
                    {ativo && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--mz-accent)] text-[color:var(--mz-on-accent)]">
                        <Icone.check className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className={`block font-semibold ${efeito ? "text-xs" : "text-[11px]"}`}>{a.nome}</span>
                    {efeito && <span className={`block text-[11px] ${C.muted}`}>{a.detalhe}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

function ModalPeca({ produto, onFechar, onAdicionar }) {
  const [acabamentoId, setAcabamentoId] = useState(ACABAMENTO_PADRAO.id);
  const [baixoId, setBaixoId] = useState(ACABAMENTO_PADRAO.id);
  const [tipo, setTipo] = useState("amostra");
  const [qtd, setQtd] = useState(REGRAS.amostra.min);
  const [texto, setTexto] = useState(String(REGRAS.amostra.min));
  const [aviso, setAviso] = useState("");
  const [tremer, setTremer] = useState(0);

  const regra = REGRAS[tipo];
  const acabamento = acabamentoPorId(acabamentoId);
  const acabamentoBaixo = produto.bipartida ? acabamentoPorId(baixoId) : null;
  const descricaoAcabamento = textoAcabamento(produto, acabamentoId, baixoId);
  const foraDoPadrao = acabamentoId !== ACABAMENTO_PADRAO.id || (produto.bipartida && baixoId !== ACABAMENTO_PADRAO.id);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const bloquear = () => {
    setAviso(regra.alerta);
    setTremer((n) => n + 1);
  };

  const definir = (n) => {
    setQtd(n);
    setTexto(String(n));
  };

  const trocarTipo = (t) => {
    setTipo(t);
    definir(REGRAS[t].min);
    setAviso("");
  };

  const diminuir = () => {
    const alvo = qtd - regra.passo;
    if (alvo < regra.min) return bloquear();
    setAviso("");
    definir(alvo);
  };

  const aumentar = () => {
    setAviso("");
    definir(Math.min(qtd + regra.passo, 99999));
  };

  const digitar = (v) => {
    const limpo = somenteDigitos(v).slice(0, 5);
    setTexto(limpo);
    const n = Number(limpo || 0);
    if (n < regra.min) setAviso(regra.alerta);
    else { setAviso(""); setQtd(n); }
  };

  const confirmarDigitado = () => {
    const n = Number(texto || 0);
    if (n < regra.min) {
      bloquear();
      definir(regra.min);
    }
  };

  const valido = Number(texto || 0) >= regra.min;
  const noMinimo = qtd <= regra.min;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mz-modal-titulo"
        className="mz-in flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-[color:var(--mz-surface)] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--mz-line)] px-5 py-4">
          <div className="min-w-0">
            <p className={`mz-mono text-xs font-semibold ${C.accentText}`}>{produto.ref}</p>
            <h2 id="mz-modal-titulo" className="mz-display text-xl font-bold">{produto.nome}</h2>
          </div>
          <button type="button" onClick={onFechar} className={`mz-focus rounded p-1 ${C.muted} hover:text-[color:var(--mz-ink)]`} aria-label="Fechar">
            <Icone.fechar className="h-6 w-6" />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_1.1fr]">
          {/* Foto */}
          <div className="flex flex-col gap-3 p-5 md:border-r md:border-[color:var(--mz-line)]">
            <ImagemPeca produto={produto} className="rounded-xl" />
            <p className="flex items-start gap-2 rounded-md bg-[color:var(--mz-accent-soft)] px-3 py-2 text-sm font-medium">
              <Swatch acabamento={ACABAMENTO_PADRAO} size="mt-0.5 h-4 w-4" />
              Foto de referência em Ouro Light. Selecione o acabamento desejado abaixo:
            </p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {[["Categoria", produto.categoria], ["Material-base (fixo)", produto.material], ["Medida", produto.medida], ["Construção", produto.bipartida ? "Bipartida (cima + baixo)" : "Peça única"]].map(([k, v]) => (
                <div key={k} className="rounded-md bg-[color:var(--mz-sunken)] px-2.5 py-2">
                  <dt className={C.muted}>{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Configuração */}
          <div className="flex flex-col gap-6 p-5">
            {produto.bipartida ? (
              <div className="flex flex-col gap-5">
                <TagBipartida className="self-start" />
                <SeletorAcabamento titulo="Cor da Parte de Cima" produto={produto} valor={acabamentoId} onChange={setAcabamentoId} />
                <SeletorAcabamento titulo="Cor da Parte de Baixo" produto={produto} valor={baixoId} onChange={setBaixoId} />
              </div>
            ) : (
              <SeletorAcabamento titulo="Cor do Acabamento" produto={produto} valor={acabamentoId} onChange={setAcabamentoId} />
            )}
            <div className="-mt-2 flex flex-wrap items-center gap-2 rounded-md bg-[color:var(--mz-sunken)] px-3 py-2 text-xs">
              <span className={C.muted}>Material no pedido:</span>
              <b>{textoMaterial(produto, acabamentoId, baixoId)}</b>
              {(acabamento.grupo === "efeito" || acabamentoBaixo?.grupo === "efeito") && (
                <span className="rounded-full bg-[color:var(--mz-accent-soft)] px-2 py-0.5 font-bold text-[color:var(--mz-accent)]">
                  Reclassificado pelo efeito especial
                </span>
              )}
            </div>
            {foraDoPadrao && (
              <div className="mz-in -mt-3 flex items-center gap-3 rounded-md border border-[color:var(--mz-line)] p-2">
                <ImagemPeca produto={produto} acabamento={acabamento} acabamentoBaixo={acabamentoBaixo} rotulo={false} className="!w-14 shrink-0 rounded" />
                <p className={`text-xs ${C.muted}`}>Simulação: <b className="text-[color:var(--mz-ink)]">{descricaoAcabamento}</b>. A cor final segue o padrão aprovado pelo laboratório.</p>
              </div>
            )}

            <fieldset>
              <legend className="mz-eyebrow mb-3">Tipo de solicitação</legend>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[color:var(--mz-sunken)] p-1" role="radiogroup">
                {["amostra", "producao"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tipo === t}
                    onClick={() => trocarTipo(t)}
                    className={`mz-focus rounded-md px-3 py-2 text-sm font-bold transition ${
                      tipo === t ? "bg-[color:var(--mz-surface)] text-[color:var(--mz-ink)] shadow-[var(--mz-shadow)]" : C.muted
                    }`}
                  >
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
              <p className={`mt-2 text-xs ${C.muted}`}>
                Mínimo de <b className="text-[color:var(--mz-ink)]">{regra.min} peças</b>
                {regra.passo > 1 ? `, em lotes de ${regra.passo}` : ""} · prazo estimado {PRAZO[tipo]}.
              </p>
            </fieldset>

            <div>
              <label htmlFor="mz-qtd" className="mz-eyebrow mb-3 block">Quantidade (peças)</label>
              <div key={tremer} className={`flex items-stretch gap-2 ${tremer ? "mz-shake" : ""}`}>
                <button
                  type="button"
                  onClick={diminuir}
                  aria-label={`Diminuir ${regra.passo}`}
                  aria-disabled={noMinimo}
                  className={`mz-focus flex w-12 items-center justify-center rounded-md border transition ${
                    noMinimo
                      ? "cursor-not-allowed border-[color:var(--mz-line)] bg-[color:var(--mz-sunken)] text-[color:var(--mz-muted)] opacity-60"
                      : "border-[color:var(--mz-line)] hover:border-[color:var(--mz-ink)]"
                  }`}
                >
                  <Icone.menos className="h-5 w-5" />
                </button>
                <input
                  id="mz-qtd"
                  inputMode="numeric"
                  className={`${C.input} mz-mono w-full text-center text-xl font-semibold ${aviso ? "border-[color:var(--mz-warn)]" : ""}`}
                  value={texto}
                  onChange={(e) => digitar(e.target.value)}
                  onBlur={confirmarDigitado}
                  aria-describedby="mz-qtd-aviso"
                />
                <button type="button" onClick={aumentar} aria-label={`Aumentar ${regra.passo}`} className="mz-focus flex w-12 items-center justify-center rounded-md border border-[color:var(--mz-line)] transition hover:border-[color:var(--mz-ink)]">
                  <Icone.mais className="h-5 w-5" />
                </button>
              </div>
              <div id="mz-qtd-aviso" aria-live="assertive" className="min-h-[2.25rem] pt-2">
                {aviso && (
                  <p className="flex items-center gap-2 rounded-md bg-[color:var(--mz-warn-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--mz-warn)]">
                    <Icone.alerta className="h-4 w-4 shrink-0" /> {aviso}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <SwatchesItem produto={produto} acabamento={acabamentoId} acabamentoBaixo={baixoId} size="h-6 w-6" />
            <span className="min-w-0 truncate">
              <b className="mz-mono">{valido ? formatarNumero(Number(texto)) : "—"}</b> pçs · {descricaoAcabamento} · {TIPO_LABEL[tipo]}
            </span>
          </div>
          <button
            type="button"
            disabled={!valido}
            onClick={() => onAdicionar({ ref: produto.ref, acabamento: acabamentoId, acabamentoBaixo: produto.bipartida ? baixoId : null, tipo, qtd: Number(texto) })}
            className={`${C.btnAccent} w-full sm:w-auto`}
          >
            <Icone.sacola className="h-4 w-4" /> Adicionar ao pedido
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- painel do pedido ----------------------------- */

function LinhaItem({ item, onQtd, onRemover, compacto = false }) {
  const p = PRODUTOS.find((x) => x.ref === item.ref);
  const a = acabamentoPorId(item.acabamento);
  const regra = REGRAS[item.tipo];
  const [aviso, setAviso] = useState("");
  const menos = () => {
    if (item.qtd - regra.passo < regra.min) { setAviso(regra.alerta); return; }
    setAviso(""); onQtd(item.qtd - regra.passo);
  };
  const mais = () => { setAviso(""); onQtd(item.qtd + regra.passo); };

  return (
    <li className="flex gap-3 py-3">
      <ImagemPeca produto={p} acabamento={a} acabamentoBaixo={item.acabamentoBaixo ? acabamentoPorId(item.acabamentoBaixo) : null} rotulo={false} className="!w-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`mz-mono text-[11px] font-semibold ${C.accentText}`}>{p.ref}</p>
            <p className="truncate text-sm font-bold">{p.nome}</p>
            <p className={`flex flex-wrap items-center gap-x-1.5 text-xs ${C.muted}`}>
              <SwatchesItem produto={p} acabamento={item.acabamento} acabamentoBaixo={item.acabamentoBaixo} size="h-3 w-3" />
              <span className="font-semibold text-[color:var(--mz-ink)]">{textoAcabamento(p, item.acabamento, item.acabamentoBaixo)}</span>
            </p>
            {p.bipartida && <TagBipartida className="mt-1" />}
          </div>
          {onRemover && (
            <button type="button" onClick={onRemover} className={`mz-focus shrink-0 rounded p-1 ${C.muted} hover:text-[color:var(--mz-warn)]`} aria-label={`Remover ${p.ref}`}>
              <Icone.lixeira className="h-4 w-4" />
            </button>
          )}
        </div>
        {compacto ? (
          <p className="mz-mono mt-1 text-sm font-semibold">{formatarNumero(item.qtd)} pçs</p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={menos} aria-label="Diminuir" className={`mz-focus flex h-7 w-7 items-center justify-center rounded border border-[color:var(--mz-line)] ${item.qtd <= regra.min ? "opacity-40" : ""}`}>
              <Icone.menos className="h-3.5 w-3.5" />
            </button>
            <span className="mz-mono min-w-[3.5rem] text-center text-sm font-semibold">{formatarNumero(item.qtd)}</span>
            <button type="button" onClick={mais} aria-label="Aumentar" className="mz-focus flex h-7 w-7 items-center justify-center rounded border border-[color:var(--mz-line)]">
              <Icone.mais className="h-3.5 w-3.5" />
            </button>
            <span className={`text-xs ${C.muted}`}>pçs</span>
          </div>
        )}
        {aviso && <p className="mt-1 text-xs font-semibold text-[color:var(--mz-warn)]">{aviso}</p>}
      </div>
    </li>
  );
}

function GrupoItens({ tipo, itens, children }) {
  if (!itens.length) return null;
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  return (
    <section className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <span className={`h-2 w-2 rounded-full ${tipo === "amostra" ? "bg-[color:var(--mz-accent)]" : "bg-[color:var(--mz-ink)]"}`} />
          {tipo === "amostra" ? "Amostras" : "Produção"}
        </h3>
        <span className={`mz-mono text-xs ${C.muted}`}>{formatarNumero(total)} pçs · {PRAZO[tipo]}</span>
      </div>
      <ul className="divide-y divide-[color:var(--mz-line)]">{children}</ul>
    </section>
  );
}

function PainelPedido({ cliente, itens, onFechar, onQtd, onRemover, onRevisar }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const total = itens.reduce((s, i) => s + i.qtd, 0);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="mz-pedido-titulo" className="mz-in flex h-full w-full max-w-md flex-col bg-[color:var(--mz-surface)] pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)] pt-[env(safe-area-inset-top,0px)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--mz-line)] px-5 py-4">
          <div className="min-w-0">
            <p className="mz-eyebrow">Pedido em aberto</p>
            <h2 id="mz-pedido-titulo" className="mz-display truncate text-lg font-bold">{cliente.nome}</h2>
          </div>
          <button type="button" onClick={onFechar} className={`mz-focus rounded p-1 ${C.muted}`} aria-label="Fechar pedido">
            <Icone.fechar className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {itens.length === 0 ? (
            <div className="py-16 text-center">
              <Icone.sacola className={`mx-auto h-10 w-10 ${C.muted}`} />
              <p className="mt-3 font-semibold">Nenhuma peça no pedido ainda.</p>
              <p className={`mt-1 text-sm ${C.muted}`}>Abra uma peça no catálogo, escolha o acabamento e adicione.</p>
            </div>
          ) : (
            ["amostra", "producao"].map((t) => (
              <GrupoItens key={t} tipo={t} itens={itens.filter((i) => i.tipo === t)}>
                {itens.filter((i) => i.tipo === t).map((i) => (
                  <LinhaItem key={i.chave} item={i} onQtd={(q) => onQtd(i.chave, q)} onRemover={() => onRemover(i.chave)} />
                ))}
              </GrupoItens>
            ))
          )}
        </div>

        <div className="border-t border-[color:var(--mz-line)] px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between text-sm">
            <span className={C.muted}>{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
            <span className="mz-mono text-base font-bold">{formatarNumero(total)} peças</span>
          </div>
          <button type="button" disabled={!itens.length} onClick={onRevisar} className={`${C.btnAccent} w-full`}>
            Revisar e finalizar
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ----------------------------- revisão e envio ----------------------------- */

function TelaRevisao({ rep, cliente, itens, onVoltar, onQtd, onRemover, onEnviar }) {
  const [confirmando, setConfirmando] = useState(false);
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  const totalAmostra = itens.filter((i) => i.tipo === "amostra").reduce((s, i) => s + i.qtd, 0);
  const totalProd = total - totalAmostra;

  return (
    <main className="mz-gutter mx-auto max-w-5xl py-8">
      <button type="button" onClick={onVoltar} className={`mz-focus inline-flex items-center gap-1 text-sm font-semibold ${C.muted} hover:text-[color:var(--mz-ink)]`}>
        <Icone.voltar className="h-4 w-4" /> Voltar ao catálogo
      </button>
      <p className="mz-eyebrow mt-4">Passo 3 de 3 · Revisão</p>
      <h1 className="mz-display mt-1 text-2xl font-bold sm:text-3xl">Confira a solicitação antes de enviar</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] px-5 py-3">
          {itens.length === 0 ? (
            <p className={`py-10 text-center text-sm ${C.muted}`}>O pedido ficou vazio. Volte ao catálogo para adicionar peças.</p>
          ) : (
            ["amostra", "producao"].map((t) => (
              <GrupoItens key={t} tipo={t} itens={itens.filter((i) => i.tipo === t)}>
                {itens.filter((i) => i.tipo === t).map((i) => (
                  <LinhaItem key={i.chave} item={i} onQtd={(q) => onQtd(i.chave, q)} onRemover={() => onRemover(i.chave)} />
                ))}
              </GrupoItens>
            ))
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5">
            <p className="mz-eyebrow">Cliente</p>
            <p className="mt-1 font-bold">{cliente.nome}</p>
            <p className={`text-sm ${C.muted}`}>{cliente.contato}</p>
            <p className={`text-sm ${C.muted}`}>{cliente.cidade} · <span className="mz-mono">{cliente.whatsapp}</span></p>
            <p className="mz-eyebrow mt-4">Representante</p>
            <p className="mt-1 text-sm font-semibold">{rep.nome} <span className={`mz-mono text-xs ${C.muted}`}>{rep.codigo}</span></p>
            <p className={`text-sm ${C.muted}`}>{rep.regiao}</p>
          </div>

          <div className="rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt className={C.muted}>Amostras</dt><dd className="mz-mono font-semibold">{formatarNumero(totalAmostra)} pçs</dd></div>
              <div className="flex justify-between"><dt className={C.muted}>Produção</dt><dd className="mz-mono font-semibold">{formatarNumero(totalProd)} pçs</dd></div>
              <div className="flex justify-between border-t border-[color:var(--mz-line)] pt-2"><dt className="font-bold">Total</dt><dd className="mz-mono font-bold">{formatarNumero(total)} pçs</dd></div>
            </dl>

            {!confirmando ? (
              <button type="button" disabled={!itens.length} onClick={() => setConfirmando(true)} className={`${C.btnAccent} mt-4 w-full`}>
                Enviar solicitação
              </button>
            ) : (
              <div className="mz-in mt-4 rounded-lg border border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)] p-3">
                <p className="text-sm font-semibold">Enviar {itens.length} {itens.length === 1 ? "item" : "itens"} ({formatarNumero(total)} pçs) para a fábrica?</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setConfirmando(false)} className={`${C.btnGhost} flex-1`}>Cancelar</button>
                  <button type="button" onClick={onEnviar} className={`${C.btnPrimary} flex-1`}>Confirmar envio</button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function useCopiar() {
  const [copiado, setCopiado] = useState(null);
  const copiar = async (id, texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      const el = document.getElementById(id);
      if (el) { el.focus(); el.select?.(); }
    }
  };
  return [copiado, copiar];
}

function TelaEnviado({ pedido, onNovoMesmoCliente, onTrocarCliente }) {
  const [copiado, copiar] = useCopiar();
  const [emailEnviadoEm, setEmailEnviadoEm] = useState(null);
  const { email } = pedido;
  const fone = somenteDigitos(pedido.cliente.whatsapp);
  const linkWhats = `https://wa.me/55${fone}?text=${encodeURIComponent(pedido.mensagem)}`;
  const textoEmail = `Para: ${email.para}\nCc: ${email.cc}\nAssunto: ${email.assunto}\n\n${email.corpo}`;

  return (
    <main className="mz-gutter mx-auto max-w-5xl py-10">
      <div className="mz-in flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--mz-ok-soft)] text-[color:var(--mz-ok)]">
          <Icone.check className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="mz-eyebrow">Solicitação registrada</p>
          <h1 className="mz-display mz-mono text-2xl font-bold">{pedido.numero}</h1>
        </div>
      </div>
      <p className={`mt-3 text-sm ${C.muted}`}>
        {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"} para <b className="text-[color:var(--mz-ink)]">{pedido.cliente.nome}</b>, registrados em {pedido.data}. Dispare o e-mail para a fábrica e envie o resumo ao cliente.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* E-mail (simulação) */}
        <section className="flex min-w-0 flex-col rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="mz-display text-lg font-bold">E-mail para a fábrica</h2>
            <span className="rounded-full bg-[color:var(--mz-sunken)] px-2 py-0.5 text-[11px] font-bold">Simulação</span>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className={C.muted}>Para</dt><dd className="mz-mono min-w-0 break-all">{email.para}</dd>
            <dt className={C.muted}>Cc</dt><dd className="mz-mono min-w-0 break-all">{email.cc}</dd>
            <dt className={C.muted}>Assunto</dt><dd className="min-w-0 font-semibold">{email.assunto}</dd>
          </dl>
          <textarea id="mz-email" readOnly rows={12} value={email.corpo} aria-label="Corpo do e-mail" className={`${C.input} mz-mono mt-3 flex-1 text-xs leading-relaxed`} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={!!emailEnviadoEm} onClick={() => setEmailEnviadoEm(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))} className={C.btnAccent}>
              {emailEnviadoEm ? <><Icone.check className="h-4 w-4" /> E-mail enviado</> : "Simular envio do e-mail"}
            </button>
            <button type="button" onClick={() => copiar("mz-email", textoEmail)} className={C.btnGhost}>
              {copiado === "mz-email" ? <><Icone.check className="h-4 w-4" /> Copiado</> : "Copiar e-mail"}
            </button>
          </div>
          {emailEnviadoEm && (
            <p role="status" className="mt-2 text-xs font-semibold text-[color:var(--mz-ok)]">
              Envio simulado às {emailEnviadoEm} para {email.para} (cópia para {email.cc}).
            </p>
          )}
        </section>

        {/* WhatsApp */}
        <section className="flex min-w-0 flex-col rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="mz-display text-lg font-bold">Resumo para WhatsApp</h2>
            <span className="mz-mono text-xs font-semibold">{pedido.cliente.whatsapp}</span>
          </div>
          <p className={`mt-3 text-sm ${C.muted}`}>Destino: {pedido.cliente.contato}</p>
          <textarea id="mz-msg" readOnly rows={12} value={pedido.mensagem} aria-label="Texto para WhatsApp" className={`${C.input} mz-mono mt-3 flex-1 text-xs leading-relaxed`} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => copiar("mz-msg", pedido.mensagem)} className={C.btnPrimary}>
              {copiado === "mz-msg" ? <><Icone.check className="h-4 w-4" /> Copiado</> : "Copiar texto"}
            </button>
            <a href={linkWhats} target="_blank" rel="noreferrer" className={C.btnGhost}>Abrir no WhatsApp</a>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-2 border-t border-[color:var(--mz-line)] pt-5 sm:grid-cols-2">
        <button type="button" onClick={onNovoMesmoCliente} className={C.btnGhost}>Nova solicitação para {pedido.cliente.nome}</button>
        <button type="button" onClick={onTrocarCliente} className={C.btnGhost}>Atender outro cliente</button>
      </div>
    </main>
  );
}

/* ----------------------------- app ----------------------------- */

export default function MetalizaApp() {
  const [rep, setRep] = useState(null);
  const [clientes, setClientes] = useState(CLIENTES_INICIAIS);
  const [cliente, setCliente] = useState(null);
  const [tela, setTela] = useState("clientes"); // clientes | catalogo | revisao | enviado
  const [peca, setPeca] = useState(null);
  const [pedidoAberto, setPedidoAberto] = useState(false);
  const [itensPorCliente, setItensPorCliente] = useState({});
  const [historico, setHistorico] = useState([]);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [toast, setToast] = useState(null);

  const itens = (cliente && itensPorCliente[cliente.id]) || [];
  const setItens = (fn) => setItensPorCliente((m) => ({ ...m, [cliente.id]: fn(m[cliente.id] || []) }));

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const entrar = (r) => { setRep(r); setTela("clientes"); };
  const sair = () => { setRep(null); setCliente(null); setPeca(null); setPedidoAberto(false); setTela("clientes"); };

  const selecionarCliente = (c) => { setCliente(c); setTela("catalogo"); window.scrollTo?.(0, 0); };
  const cadastrarCliente = (c) => {
    setClientes((l) => [c, ...l]);
    setToast(`${c.nome} cadastrado.`);
    selecionarCliente(c);
  };
  const trocarCliente = () => { setPedidoAberto(false); setPeca(null); setTela("clientes"); };

  const adicionar = (novo) => {
    const chave = `${novo.ref}|${novo.acabamento}|${novo.acabamentoBaixo || "-"}|${novo.tipo}`;
    setItens((lista) => {
      const existente = lista.find((i) => i.chave === chave);
      if (existente) {
        return lista.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + novo.qtd } : i));
      }
      return [...lista, { ...novo, chave }];
    });
    setPeca(null);
    const prod = PRODUTOS.find((x) => x.ref === novo.ref);
    setToast(`${novo.ref} · ${textoAcabamento(prod, novo.acabamento, novo.acabamentoBaixo)} · ${formatarNumero(novo.qtd)} pçs adicionadas (${TIPO_LABEL[novo.tipo]}).`);
  };

  const alterarQtd = (chave, q) => setItens((l) => l.map((i) => (i.chave === chave ? { ...i, qtd: q } : i)));
  const remover = (chave) => setItens((l) => l.filter((i) => i.chave !== chave));

  const enviar = () => {
    const numero = gerarNumeroPedido(historico.length + 1);
    const registro = {
      numero,
      data: hojeFormatado(),
      clienteId: cliente.id,
      cliente,
      itens,
      mensagem: montarMensagem({ numero, rep, cliente, itens }),
      email: montarEmail({ numero, rep, cliente, itens }),
    };
    setHistorico((h) => [...h, registro]);
    setUltimoPedido(registro);
    setClientes((l) => l.map((c) => (c.id === cliente.id ? { ...c, ultimoPedido: registro.data, novo: false } : c)));
    setItensPorCliente((m) => ({ ...m, [cliente.id]: [] }));
    setTela("enviado");
    window.scrollTo?.(0, 0);
  };

  const qtdItens = itens.length;

  return (
    <div className="mz-root">
      <style>{ESTILOS}</style>

      {!rep ? (
        <TelaLogin onEntrar={entrar} />
      ) : (
        <>
          <Cabecalho
            rep={rep}
            cliente={tela === "clientes" ? null : cliente}
            qtdItens={qtdItens}
            onTrocarCliente={trocarCliente}
            onSair={sair}
            onAbrirPedido={() => setPedidoAberto(true)}
          />

          {tela === "clientes" && (
            <TelaClientes clientes={clientes} historico={historico} onSelecionar={selecionarCliente} onCadastrar={cadastrarCliente} />
          )}
          {tela === "catalogo" && cliente && (
            <TelaCatalogo cliente={cliente} itensPedido={itens} onAbrirPeca={setPeca} />
          )}
          {tela === "revisao" && cliente && (
            <TelaRevisao rep={rep} cliente={cliente} itens={itens} onVoltar={() => setTela("catalogo")} onQtd={alterarQtd} onRemover={remover} onEnviar={enviar} />
          )}
          {tela === "enviado" && ultimoPedido && (
            <TelaEnviado pedido={ultimoPedido} onNovoMesmoCliente={() => setTela("catalogo")} onTrocarCliente={trocarCliente} />
          )}

          {tela === "catalogo" && qtdItens > 0 && !pedidoAberto && !peca && (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <button type="button" onClick={() => setPedidoAberto(true)} className={`${C.btnPrimary} pointer-events-auto shadow-[var(--mz-shadow)]`}>
                <Icone.sacola className="h-4 w-4" /> Ver pedido · {qtdItens} {qtdItens === 1 ? "item" : "itens"}
              </button>
            </div>
          )}

          {peca && <ModalPeca produto={peca} onFechar={() => setPeca(null)} onAdicionar={adicionar} />}
          {pedidoAberto && cliente && (
            <PainelPedido
              cliente={cliente}
              itens={itens}
              onFechar={() => setPedidoAberto(false)}
              onQtd={alterarQtd}
              onRemover={remover}
              onRevisar={() => { setPedidoAberto(false); setTela("revisao"); window.scrollTo?.(0, 0); }}
            />
          )}

          {toast && (
            <div role="status" className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+4.5rem)] z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg bg-[color:var(--mz-ink)] px-4 py-3 text-sm font-semibold text-[color:var(--mz-bg)] shadow-2xl">
              {toast}
            </div>
          )}
        </>
      )}
    </div>
  );
}
