import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

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

// Clientes de demonstração já com o cadastro PJ completo (dados fictícios; CNPJs com dígitos verificadores válidos)
const CLIENTES_INICIAIS = [
  {
    id: "c1",
    nome: "Calçados Bella Passo",
    fantasia: "Calçados Bella Passo",
    razaoSocial: "Bella Passo Indústria de Calçados Ltda.",
    cnpj: "12.847.365/0001-35",
    ie: "124/0587312",
    cep: "93510-120",
    logradouro: "Rua Bento Gonçalves",
    numero: "1840",
    complemento: "Pavilhão 2",
    bairro: "Centro",
    municipio: "Novo Hamburgo",
    uf: "RS",
    cidade: "Novo Hamburgo/RS",
    contato: "Juliana Prates (modelista)",
    whatsapp: "(51) 99812-4410",
    email: "compras@bellapasso.com.br",
    ultimoPedido: "12/09/2026",
  },
  {
    id: "c2",
    nome: "Studio Valentina Shoes",
    fantasia: "Studio Valentina Shoes",
    razaoSocial: "Valentina Calçados Femininos Eireli",
    cnpj: "34.192.687/0001-26",
    ie: "310.442.718.115",
    cep: "14401-322",
    logradouro: "Avenida Brasil",
    numero: "2215",
    complemento: "",
    bairro: "Vila Aparecida",
    municipio: "Franca",
    uf: "SP",
    cidade: "Franca/SP",
    contato: "Marcos Lemos (desenvolvimento)",
    whatsapp: "(16) 99734-2208",
    email: "nfe@studiovalentina.com.br",
    ultimoPedido: "28/08/2026",
  },
  {
    id: "c3",
    nome: "Ateliê Dona Flor Calçados",
    fantasia: "Ateliê Dona Flor Calçados",
    razaoSocial: "Dona Flor Artefatos de Couro Ltda. ME",
    cnpj: "56.731.824/0001-96",
    ie: "001.234567.00-89",
    cep: "35520-005",
    logradouro: "Rua Antônio Martins",
    numero: "312",
    complemento: "Sala 4",
    bairro: "Santa Rita",
    municipio: "Nova Serrana",
    uf: "MG",
    cidade: "Nova Serrana/MG",
    contato: "Renata Souza (modelista)",
    whatsapp: "(37) 99155-7821",
    email: "financeiro@donaflor.com.br",
    ultimoPedido: null,
  },
];

// Coleções de lançamento: exclusivas por 90 dias; depois as peças migram para a Linha Permanente.
const DIA_MS = 86400000;
const CICLO_DIAS = 90;
const inicioDoDia = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
// Lançamento simulado há 48 dias, para a demonstração abrir sempre com 42 dias restantes
const LANCAMENTOS = [{ nome: "Verão 2026", lancadaEm: new Date(inicioDoDia().getTime() - 48 * DIA_MS) }];
const diasRestantes = (l) => Math.max(0, Math.ceil((l.lancadaEm.getTime() + CICLO_DIAS * DIA_MS - inicioDoDia().getTime()) / DIA_MS));
const diasPassados = (l) => Math.min(CICLO_DIAS, CICLO_DIAS - diasRestantes(l));

const VISAO_GERAL = "Catálogo Geral / Linha Permanente";
// Navegação: só a linha permanente e as coleções de lançamento (sem visão misturada)
const VISOES = [VISAO_GERAL, ...LANCAMENTOS.map((l) => l.nome)];
// Abertura padrão: o primeiro lançamento em vigor; sem lançamento ativo, a linha permanente
const visaoInicial = (ativas) => LANCAMENTOS.find((l) => ativas.has(l.nome))?.nome || VISAO_GERAL;

// ativas = Set com os nomes das coleções em vigor
const emLancamento = (p, ativas) => Boolean(p.colecao && ativas.has(p.colecao));
const pecasDaVisao = (visao, ativas) =>
  PRODUTOS.filter((p) => {
    if (visao === VISAO_GERAL) return !emLancamento(p, ativas);
    return p.colecao === visao && emLancamento(p, ativas);
  });
const rotuloColecao = (p, ativas) => (emLancamento(p, ativas) ? p.colecao : "Linha permanente");

const CATEGORIAS = ["Todos", "Enfeites", "Fivelas", "Passadores", "Ponteiras", "Correntes"];

let PRODUTOS = [
  // Lançamento Verão 2026 (exclusivas enquanto a coleção estiver ativa)
  { ref: "CR 101", categoria: "Correntes", foto: "cr101", colecao: "Linha" },
  { ref: "EF 661", categoria: "Enfeites", foto: "ef661", colecao: "Verão 2026" },
  {
    ref: "EF 1170",
    categoria: "Enfeites",
    foto: "ef1170",
    colecao: "Verão 2026",
  },
  { ref: "PS 1030", categoria: "Passadores", foto: "ps1030", colecao: "Verão 2026" },
  // Linha permanente (Catálogo Geral)
  { ref: "EF 1143", categoria: "Enfeites", foto: "ef1143" },
  { ref: "EF 1150", categoria: "Enfeites", foto: "ef1150" },
  { ref: "PS 1027", categoria: "Passadores", foto: "ps1027" },
  { ref: "PS 057", categoria: "Passadores", foto: "ps057" },
];

const ACABAMENTOS = [
  // Banhos tradicionais. Escolha só técnica: a foto não muda.
  { id: "ouro-light", codigo: "6", nome: "Ouro Light", grupo: "banho", cores: ["#FBF3C8", "#EBD58A", "#C9A954", "#8E7430"] },
  { id: "ouro-24k", codigo: "1", nome: "Ouro 24k", grupo: "banho", cores: ["#FFE08A", "#E7B43C", "#B07A16", "#6E4708"] },
  { id: "niquel", codigo: "2", nome: "Níquel", grupo: "banho", cores: ["#FAFBFC", "#D2D7DC", "#929AA1", "#5A6066"] },
  { id: "onix", codigo: "3", nome: "Ônix", grupo: "banho", cores: ["#7D8187", "#45484D", "#222428", "#0D0E10"] },
  { id: "marrom", codigo: "4", nome: "Marrom", grupo: "banho", cores: ["#C79A7A", "#8E5A3C", "#5C3420", "#2E180C"] },
  // Cor oculta: não aparece na cartela; só pela busca de código (1554) ou nome
  { id: "ouro-queimado", codigo: "1554", nome: "Ouro Queimado", grupo: "banho", oculta: true, cores: ["#EBBE78", "#BC7A30", "#7E4614", "#452208"] },
  // Bicolores prontos: atendem as peças de duas cores com um único código
  { id: "ouro-light-preto", codigo: "50", nome: "Ouro Light / Preto", grupo: "bicolor", cores: ["#FBF3C8", "#EBD58A", "#C9A954", "#8E7430"], cores2: ["#45484D", "#222428", "#0D0E10", "#000000"] },
  { id: "dourado-branco", codigo: "51", nome: "Dourado / Branco", grupo: "bicolor", cores: ["#FFE08A", "#E7B43C", "#B07A16", "#6E4708"], cores2: ["#FFFFFF", "#F4F4F2", "#E4E4E0", "#C9C9C4"] },
];
const GRUPOS_ACABAMENTO = [
  { id: "banho", titulo: "Banhos" },
  { id: "bicolor", titulo: "Bicolores" },
];
const ACABAMENTO_PADRAO = ACABAMENTOS[0];
const acabamentoPorCodigo = (cod) => ACABAMENTOS.find((a) => a.codigo === String(cod).trim());
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Busca por código exato ou por nome (só seleciona quando o nome identifica uma única cor)
function buscarAcabamento(termo) {
  const t = semAcento(termo);
  if (!t) return { tipo: "vazio" };
  if (/^\d+$/.test(t)) {
    const achado = acabamentoPorCodigo(t);
    if (achado) return { tipo: "achado", acabamento: achado };
    const prefixo = ACABAMENTOS.some((a) => a.codigo.startsWith(t));
    return { tipo: prefixo ? "parcial" : "inexistente" };
  }
  if (t.length < 3) return { tipo: "parcial" };
  const nomes = ACABAMENTOS.filter((a) => semAcento(a.nome).includes(t) || (a.rotulo && semAcento(a.rotulo).includes(t)));
  if (nomes.length === 1) return { tipo: "achado", acabamento: nomes[0] };
  return { tipo: nomes.length ? "varios" : "inexistente", opcoes: nomes };
}

// Afra: só para Enfeites e Fivelas (não existe para Passadores e Ponteiras)
const CATEGORIAS_COM_AFRA = ["Enfeites", "Fivelas"];
const temAfra = (produto) => CATEGORIAS_COM_AFRA.includes(produto.categoria);
const LINHAS_AFRA = [
  { titulo: "Linha 800", codigos: ["800", "801", "802", "803", "804", "805", "806", "807"] },
  { titulo: "Linha 900", codigos: ["901", "902", "903", "904", "905", "906", "907"] },
];
const acabamentoPorId = (id) => ACABAMENTOS.find((a) => a.id === id) || ACABAMENTO_PADRAO;

const TIPO_LABEL = { amostra: "Amostra", producao: "Pedido de Produção" };
const ehCorrente = (produto) => produto?.categoria === "Correntes" || produto?.ref?.startsWith("CR");
// Categoria no singular para a identificação da peça (filtros usam o plural)
const CATEGORIA_SINGULAR = {
  Enfeites: "Enfeite",
  Fivelas: "Fivela",
  Ponteiras: "Ponteira",
  Passadores: "Passador",
  Correntes: "Corrente",
};
const categoriaPeca = (produto) => CATEGORIA_SINGULAR[produto.categoria] || produto.categoria;
const rotuloRef = (produto) => `Ref. ${produto.ref.toUpperCase()}`;
const normalizarRef = (t) => t.toUpperCase().replace(/^REF\.?\s*/, "").replace(/\s+/g, "");

// Cor com o código do ERP para o PCP: "[Cód. 6] Ouro Light", "[Cód. 50] Ouro Light / Preto"
const rotuloAcabamentoComCodigo = (acabamentoId) => {
  const a = acabamentoPorId(acabamentoId);
  return `[Cód. ${a.codigo}] ${a.nome}`;
};
const textoAcabamento = (acabamentoId) => `Acabamento: ${rotuloAcabamentoComCodigo(acabamentoId)}`;

// Identificação da peça: "Ref. EF 661 - Enfeite". O material de injeção não entra: quem define é o PCP, no ERP.
function textoPeca(produto) {
  return `${rotuloRef(produto)} - ${categoriaPeca(produto)}`;
}

// Afra só aparece quando escolhida (Enfeites e Fivelas)
function textoAfra(produto, item) {
  return temAfra(produto) && item.afra ? `Afra: ${item.afra}` : null;
}

// Linha completa do item, ex.:
// "Ref. EF 1170 - Enfeite · Acabamento: [Cód. 50] Ouro Light / Preto · Qtd: 500 un"
// "Ref. CR 101 - Corrente · 45 elos · Com Ponteira · Acabamento: [Cód. 6] Ouro Light · Qtd: 100 un"
function linhaPedido(produto, item) {
  return [
    textoPeca(produto),
    item.elos ? `${item.elos} elos` : null,
    item.comPonteira === true ? "Com Ponteira" : item.comPonteira === false ? "Sem Ponteira" : null,
    textoAcabamento(item.acabamento),
    textoAfra(produto, item),
    `Qtd: ${formatarNumero(item.qtd)} un`,
  ]
    .filter(Boolean)
    .join(" · ");
}

const EMAIL_PEDIDOS = "pcp@metalizacromagem.com.br";

// Cliente Supabase opcional (window.supabase). Sem ele, o app roda com o acesso de demonstração e o catálogo local.
const obterSupabase = () => {
  const sb = typeof window !== "undefined" ? window.supabase : null;
  return sb && sb.auth && typeof sb.from === "function" ? sb : null;
};

/* ----------------------------- utilidades ----------------------------- */

const somenteDigitos = (s) => s.replace(/\D/g, "");

function mascaraWhatsapp(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mascaraCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  let s = d.slice(0, 2);
  if (d.length > 2) s += `.${d.slice(2, 5)}`;
  if (d.length > 5) s += `.${d.slice(5, 8)}`;
  if (d.length > 8) s += `/${d.slice(8, 12)}`;
  if (d.length > 12) s += `-${d.slice(12)}`;
  return s;
}

// CNPJ válido: 14 dígitos, não repetidos, com os dois dígitos verificadores corretos
function cnpjValido(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const digito = (n) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = pesos.reduce((soma, peso, i) => soma + peso * Number(d[i]), 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(12) === Number(d[12]) && digito(13) === Number(d[13]);
}

function mascaraCep(valor) {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// "Rua, Nº, Compl - Bairro"
function enderecoCliente(c) {
  const rua = [c.logradouro, c.numero, c.complemento].filter(Boolean).join(", ");
  return c.bairro ? `${rua} - ${c.bairro}` : rua;
}

// Bloco fiscal enviado ao PCP para faturamento sem divergências
function blocoFiscal(c) {
  return [
    "DADOS CADASTRAIS DO CLIENTE:",
    `Razão Social: ${c.razaoSocial || c.nome} (Fantasia: ${c.fantasia || c.nome})`,
    `CNPJ: ${c.cnpj || "—"} | IE: ${c.ie || "—"}`,
    `Endereço: ${enderecoCliente(c) || "—"} · CEP: ${c.cep || "—"} · ${c.municipio && c.uf ? `${c.municipio}/${c.uf}` : c.cidade}`,
    `Comprador: ${c.contato} | Telefone/WhatsApp: ${c.whatsapp}`,
    `E-mail: ${c.email || "—"}`,
  ];
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
      linhas.push(`• ${linhaPedido(p, i)}`);
    });
  });
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  linhas.push("");
  linhas.push(`Total: ${formatarNumero(total)} un em ${itens.length} ${itens.length === 1 ? "item" : "itens"}`);
  return linhas;
}

function colecoesDoPedido(itens) {
  return [...new Set(itens.map((i) => i.colecao).filter(Boolean))].join(", ") || "—";
}

function montarMensagem({ numero, rep, cliente, itens }) {
  return [
    `*Metaliza · Solicitação ${numero}*`,
    `Data: ${hojeFormatado()}`,
    "",
    ...blocoFiscal(cliente),
    "",
    `Representante: ${rep.nome} · ${rep.regiao}`,
    `Coleção: ${colecoesDoPedido(itens)}`,
    ...linhasItens(itens, true),
  ].join("\n");
}

function montarEmail({ numero, rep, cliente, itens }) {
  const total = itens.reduce((s, i) => s + i.qtd, 0);
  return {
    para: EMAIL_PEDIDOS,
    cc: rep.email,
    assunto: `[${numero}] ${cliente.nome} · ${itens.length} ${itens.length === 1 ? "item" : "itens"} · ${formatarNumero(total)} un`,
    corpo: [
      `Solicitação ${numero} registrada em ${hojeFormatado()}.`,
      "",
      ...blocoFiscal(cliente),
      "",
      `Representante: ${rep.nome} (${rep.codigo}) · ${rep.regiao}`,
      `Coleção: ${colecoesDoPedido(itens)}`,
      ...linhasItens(itens, false),
    ].join("\n"),
  };
}

/* ----------------------------- estilos/tokens ----------------------------- */

const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
/* Layout: app mobile-first. Cabeçalho compacto com a marca, vitrine em 2 colunas, bottom sheets e barra inferior fixa.
   Tema único claro (fundo branco), por decisão de marca: azul Metaliza da logo como cor primária. */
:root {
  --mz-bg: #FFFFFF;
  --mz-surface: #FFFFFF;
  --mz-soft: #F8FAFC;
  --mz-sunken: #F1F5F9;
  --mz-ink: #0F172A;
  --mz-ink-2: #334155;
  --mz-muted: #5B6779;
  --mz-line: #E2E8F0;
  --mz-accent: #203F6E;       /* azul Metaliza (fundo da logo) */
  --mz-accent-2: #2C5596;     /* azul Metaliza em estado ativo/hover */
  --mz-accent-soft: #E8EEF7;
  --mz-on-accent: #FFFFFF;
  --mz-ok: #15803D;
  --mz-ok-soft: #DCFCE7;
  --mz-warn: #B42318;
  --mz-warn-soft: #FEE4E2;
  --mz-shadow: 0 1px 2px rgba(15,23,42,.06), 0 12px 32px -14px rgba(15,23,42,.22);
  --mz-display: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mz-body: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mz-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  color-scheme: light;
}
.mz-root { background: var(--mz-bg); color: var(--mz-ink); font-family: var(--mz-body); min-height: 100%; -webkit-tap-highlight-color: transparent; }
.mz-display { font-family: var(--mz-display); font-weight: 750; letter-spacing: -0.02em; text-wrap: balance; }
.mz-mono { font-family: var(--mz-mono); font-variant-numeric: tabular-nums; }
.mz-ref { font-family: var(--mz-body); font-weight: 700; letter-spacing: .03em; text-transform: uppercase; font-variant-numeric: tabular-nums; }
.mz-eyebrow { font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; color: var(--mz-muted); }
.mz-gutter { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.mz-focus:focus-visible { outline: 2px solid var(--mz-accent-2); outline-offset: 2px; }
.mz-scroll-x { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.mz-scroll-x::-webkit-scrollbar { display: none; }
.mz-sheen { position: relative; overflow: hidden; }
.mz-sheen::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.28) 50%, transparent 65%); transform: translateX(-120%); transition: transform .9s ease; pointer-events: none; }
.mz-sheen:hover::after { transform: translateX(120%); }
.mz-slide { grid-area: 1 / 1; transition: opacity .6s ease, visibility .6s; }
.mz-slide[aria-hidden="true"] { opacity: 0; visibility: hidden; }
@keyframes mz-in { from { opacity: .4; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.mz-in { animation: mz-in .22s ease-out; }
@keyframes mz-sheet { from { transform: translateY(100%); } to { transform: none; } }
.mz-sheet { animation: mz-sheet .32s cubic-bezier(.2,.8,.2,1); }
@media (min-width: 640px) { .mz-sheet { animation: mz-in .22s ease-out; } }
@keyframes mz-gaveta { from { transform: translateX(-100%); } to { transform: none; } }
.mz-gaveta { animation: mz-gaveta .28s cubic-bezier(.2,.8,.2,1); }
@keyframes mz-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.mz-shake { animation: mz-shake .25s ease-in-out 2; }
@media (prefers-reduced-motion: reduce) { .mz-in, .mz-shake, .mz-gaveta, .mz-sheet { animation: none; } .mz-sheen::after { display: none; } .mz-slide { transition: none; } }
`;

// Classes reutilizadas (Tailwind com tokens CSS). Alvos de toque com no mínimo 48px de altura.
const C = {
  surface: "bg-[color:var(--mz-surface)]",
  sunken: "bg-[color:var(--mz-sunken)]",
  line: "border-[color:var(--mz-line)]",
  muted: "text-[color:var(--mz-muted)]",
  accentText: "text-[color:var(--mz-accent)]",
  btnPrimary:
    "mz-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[color:var(--mz-accent)] px-5 text-[15px] font-semibold text-white transition hover:bg-[color:var(--mz-accent-2)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40",
  btnAccent:
    "mz-focus mz-sheen inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[color:var(--mz-accent)] px-5 text-[15px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(32,63,110,.7)] transition hover:bg-[color:var(--mz-accent-2)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
  btnGhost:
    "mz-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[color:var(--mz-line)] bg-white px-5 text-[15px] font-semibold text-[color:var(--mz-ink)] transition hover:border-[color:var(--mz-accent)] hover:text-[color:var(--mz-accent)] active:scale-[.98]",
  btnOutline:
    "mz-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--mz-accent)] bg-white px-5 text-[15px] font-semibold text-[color:var(--mz-accent)] transition hover:bg-[color:var(--mz-accent-soft,#EEF3FA)] active:scale-[.98]",
  input:
    "mz-focus min-h-[48px] w-full rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-soft)] px-4 text-base text-[color:var(--mz-ink)] placeholder:text-[color:var(--mz-muted)] focus:border-[color:var(--mz-accent)] focus:bg-white",
  fechar:
    "mz-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--mz-ink-2)] transition hover:bg-[color:var(--mz-sunken)]",
};

// Marca Metaliza: logo oficial + nome
function Marca({ tamanho = "h-8 w-8", texto = true, className = "" }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <img src={LOGO_METALIZA} alt={texto ? "" : "Metaliza"} className={`${tamanho} shrink-0 rounded-lg`} draggable={false} />
      {texto && <span className="truncate text-[17px] font-extrabold tracking-tight text-[color:var(--mz-accent)]">Metaliza</span>}
    </span>
  );
}

// Bottom sheet: arrastar a alça para baixo fecha
function useArrastarParaFechar(onFechar) {
  const inicio = useRef(null);
  return {
    onTouchStart: (e) => { inicio.current = e.touches[0].clientY; },
    onTouchEnd: (e) => {
      if (inicio.current != null && e.changedTouches[0].clientY - inicio.current > 70) onFechar();
      inicio.current = null;
    },
  };
}

function AlcaSheet({ arrastar }) {
  return (
    <div className="flex justify-center pb-1 pt-2.5 sm:hidden" {...arrastar}>
      <span className="h-1.5 w-11 rounded-full bg-[color:var(--mz-line)]" aria-hidden="true" />
    </div>
  );
}

/* ----------------------------- imagem da peça ----------------------------- */

// Foto original da peça, sempre inteira (object-contain) e sem qualquer alteração de cor.
// O fundo neutro é o mesmo cinza das fotos, para a imagem se fundir ao quadro.
const FUNDO_FOTO = "#DFDFDF";

function resolverFoto(produto) {
  if (!produto || !produto.foto) return null;

  // 1. Se estiver no catálogo local antigo
  if (typeof FOTOS !== "undefined" && FOTOS[produto.foto]) {
    return FOTOS[produto.foto];
  }

  // 2. Se já for a URL completa (https://...)
  if (typeof produto.foto === "string" && (produto.foto.startsWith("http://") || produto.foto.startsWith("https://"))) {
    return { src: produto.foto, fundo: FUNDO_FOTO };
  }

  // 3. Se for o nome do arquivo enviado para o bucket "produtos" no Supabase Storage
  if (obterSupabase()?.storage) {
    const { data } = obterSupabase().storage.from("produtos").getPublicUrl(produto.foto);
    if (data?.publicUrl) {
      return { src: data.publicUrl, fundo: FUNDO_FOTO };
    }
  }

  return null;
}

const fundoDaFoto = (produto) => resolverFoto(produto)?.fundo || FUNDO_FOTO;

function ImagemPeca({ produto, alturaMax = 260, miniatura = false, className = "" }) {
  const foto = resolverFoto(produto);
  const alt = `Foto da peça ${rotuloRef(produto)}`;
  if (!foto) {
    return miniatura ? (
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-center text-[9px] font-semibold leading-tight text-[#6B6F75] ${className}`} style={{ background: FUNDO_FOTO }}>
        Foto pendente
      </div>
    ) : (
      <div className={`flex w-full flex-col items-center justify-center gap-1 py-10 text-center text-[#5F646A] ${className}`} style={{ background: FUNDO_FOTO, minHeight: Math.min(alturaMax, 200) }} role="img" aria-label={`Foto da ${rotuloRef(produto)} pendente`}>
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4 4 3 3-2 4 3" />
        </svg>
        <span className="mz-mono text-sm font-bold">{rotuloRef(produto)}</span>
        <span className="text-xs">Foto da peça pendente</span>
      </div>
    );
  }
  if (miniatura) {
    return (
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md p-0.5 ${className}`} style={{ background: foto.fundo || FUNDO_FOTO }}>
        <img src={foto.src} alt={alt} width={foto.w} height={foto.h} className="block h-full w-full object-contain" draggable={false} />
      </div>
    );
  }
  return (
    <div className={`flex w-full items-center justify-center ${className}`} style={{ background: foto.fundo || FUNDO_FOTO }}>
      {/* alturaMax pode ser px (número) ou "100%" para caber no quadro; object-contain nunca corta a foto */}
      <img
        src={foto.src}
        alt={alt}
        width={foto.w}
        height={foto.h}
        className="block h-auto w-full max-w-full object-contain"
        style={{ maxHeight: alturaMax }}
        draggable={false}
      />
    </div>
  );
}

function Swatch({ acabamento, size = "h-9 w-9" }) {
  const [c1, c2, c3, c4] = acabamento.cores;
  // Bicolor: metade de cada cor, na diagonal
  const fundo = acabamento.cores2
    ? `linear-gradient(135deg, ${c1} 0%, ${c3} 50%, ${acabamento.cores2[1]} 50%, ${acabamento.cores2[3]} 100%)`
    : `linear-gradient(135deg, ${c1} 0%, ${c2} 40%, ${c1} 55%, ${c3} 80%, ${c4} 100%)`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/15 ${size}`}
      style={{ background: fundo }}
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

  const [carregando, setCarregando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe email e senha para entrar.");
      return;
    }

    const supabase = obterSupabase();
    if (!supabase) {
      if (email.trim().toLowerCase() !== REPRESENTANTE_DEMO.email || senha !== REPRESENTANTE_DEMO.senha) {
        setErro("Email ou senha não conferem. Use o acesso de demonstração abaixo.");
        return;
      }
      onEntrar(REPRESENTANTE_DEMO);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(
          error.message === "Invalid login credentials"
            ? "Email ou senha incorretos no Supabase."
            : error.message
        );
        return;
      }

      // Monta o objeto do representante logado com dados reais da conta
      const user = data.user;
      const representanteReal = {
        id: user.id,
        nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Representante",
        email: user.email,
        regiao: user.user_metadata?.regiao || "Região Polo Calçadista",
        codigo: user.user_metadata?.codigo || "REP-001",
      };

      onEntrar(representanteReal);
    } catch (err) {
      setErro("Erro de conexão ao tentar autenticar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="mz-gutter flex min-h-screen items-center justify-center bg-[color:var(--mz-soft)] py-10">
      <div className="mz-in grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] shadow-[var(--mz-shadow)] md:grid-cols-2">
        <div className="relative hidden flex-col justify-between gap-6 bg-[color:var(--mz-accent)] p-8 text-white md:flex">
          <div>
            <img src={LOGO_METALIZA} alt="Metaliza" className="h-20 w-20 rounded-2xl ring-1 ring-white/20" />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Galvanoplastia para calçados femininos</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Metaliza</h1>
            <p className="mt-2 max-w-xs text-sm text-white/75">
              Catálogo técnico, amostras e pedidos de produção na palma da mão do representante.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PRODUTOS.slice(0, 6).map((p) => (
              <ImagemPeca key={p.ref} produto={p} alturaMax={110} className="h-full overflow-hidden" />
            ))}
          </div>
          <div className="flex gap-2">
            {ACABAMENTOS.filter((a) => !a.oculta).map((a) => (
              <Swatch key={a.id} acabamento={a} size="h-5 w-5" />
            ))}
          </div>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-5 p-6 sm:p-8" noValidate>
          <div>
            <Marca tamanho="h-12 w-12" className="mb-4 md:hidden" />
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

function Cabecalho({ cliente, apresentacao, qtdItens, onAbrirMenu, onTrocarCliente, onAbrirPedido }) {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-[color:var(--mz-line)] bg-white/95 backdrop-blur">
      <div className="mz-gutter mx-auto flex h-14 max-w-7xl items-center gap-1.5">
        <button type="button" onClick={onAbrirMenu} aria-label="Abrir menu de coleções" className={`${C.fechar} -ml-2 text-[color:var(--mz-accent)]`}>
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
        <Marca />

        <div className="ml-auto flex items-center gap-1">
          {cliente && (
            <button type="button" onClick={onTrocarCliente} className="mz-focus hidden min-h-[44px] max-w-[16rem] rounded-xl px-3 text-right hover:bg-[color:var(--mz-sunken)] sm:block" title="Trocar cliente">
              <span className="mz-eyebrow block text-[9px]">Atendendo</span>
              <span className="block truncate text-sm font-semibold">{cliente.nome}</span>
            </button>
          )}
          {(cliente || apresentacao) && (
            <button
              type="button"
              onClick={onAbrirPedido}
              aria-label={qtdItens ? `Pedido com ${qtdItens} ${qtdItens === 1 ? "item" : "itens"}` : "Pedido"}
              className="mz-focus relative flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl px-2.5 text-[color:var(--mz-accent)] transition hover:bg-[color:var(--mz-sunken)]"
            >
              <Icone.sacola className="h-6 w-6" />
              <span className="hidden text-sm font-semibold sm:inline">Pedido</span>
              {qtdItens > 0 && (
                <span className="mz-mono absolute right-0.5 top-0.5 min-w-[20px] rounded-full bg-[color:var(--mz-accent)] px-1 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-white">{qtdItens}</span>
              )}
            </button>
          )}
        </div>
      </div>
      {cliente && (
        <button type="button" onClick={onTrocarCliente} className="mz-gutter mz-focus flex min-h-[44px] w-full items-center justify-between gap-3 border-t border-[color:var(--mz-line)] bg-[color:var(--mz-soft)] text-left text-sm sm:hidden">
          <span className="min-w-0 truncate"><span className={C.muted}>Atendendo </span><b className="font-semibold">{cliente.nome}</b></span>
          <span className={`shrink-0 text-sm font-semibold ${C.accentText}`}>Trocar</span>
        </button>
      )}
      {apresentacao && (
        <button
          type="button"
          onClick={onTrocarCliente}
          aria-label="Modo Apresentação, sem cliente selecionado. Selecionar cliente"
          className="mz-gutter mz-focus flex min-h-[44px] w-full items-center justify-between gap-2 border-t border-[color:var(--mz-accent-soft)] bg-[color:var(--mz-accent-soft)] text-left"
        >
          <span className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-[color:var(--mz-accent)]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--mz-accent)]" aria-hidden="true" />
            <span className="truncate">Modo Apresentação • Sem cliente selecionado</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--mz-accent)]" strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}

function GavetaMenu({ rep, cliente, apresentacao, colecao, ativas, encerradas, onEscolherColecao, onSimularExpiracao, onDesfazerExpiracao, onTrocarCliente, onTrocarModo, onSair, onFechar }) {
  const fecharRef = useRef(null);
  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <nav
        aria-label="Coleções e atendimento"
        className="mz-gaveta flex h-full w-[84vw] max-w-[22rem] flex-col overflow-y-auto bg-white pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pt-[env(safe-area-inset-top,0px)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--mz-line)] px-5 py-3">
          <Marca tamanho="h-9 w-9" />
          <button ref={fecharRef} type="button" onClick={onFechar} aria-label="Fechar menu" className={`${C.fechar} -mr-2`}>
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <div className="px-4 py-5">
          <p className="mz-eyebrow px-1">Catálogo</p>
          <ul className="mt-2 flex flex-col">
            {VISOES.map((v) => {
              const ativo = colecao === v;
              const lanc = LANCAMENTOS.find((l) => l.nome === v);
              const encerrada = lanc && !ativas.has(v);
              const qtd = pecasDaVisao(v, ativas).length;
              return (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => onEscolherColecao(v)}
                    disabled={encerrada}
                    aria-current={ativo ? "page" : undefined}
                    className={`mz-focus group my-1 flex w-full flex-col rounded-2xl border-2 px-4 py-3.5 text-left transition disabled:cursor-not-allowed ${
                      ativo ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)]" : "border-transparent hover:bg-[color:var(--mz-soft)]"
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className={`text-lg font-bold leading-tight ${ativo ? "text-[color:var(--mz-accent)]" : ""} ${encerrada ? "line-through opacity-50" : ""}`}>{v}</span>
                      <span className={`mz-mono rounded-full px-2 py-0.5 text-xs font-semibold ${ativo ? "bg-[color:var(--mz-accent)] text-white" : "bg-[color:var(--mz-sunken)] text-[color:var(--mz-ink-2)]"}`}>{qtd}</span>
                    </span>
                    {lanc && !encerrada && (
                      <span className="mt-1.5 flex w-full flex-col gap-1">
                        <span className={`text-xs ${C.muted}`}>🔥 Coleção ativa • Restam <b className="font-medium text-[color:var(--mz-ink)]">{diasRestantes(lanc)} dias</b></span>
                        <span className="h-0.5 w-full overflow-hidden rounded-full bg-[color:var(--mz-line)]" aria-hidden="true">
                          <span className="block h-full bg-[color:var(--mz-accent)]" style={{ width: `${(diasPassados(lanc) / CICLO_DIAS) * 100}%` }} />
                        </span>
                      </span>
                    )}
                    {encerrada && <span className={`mt-1 text-xs ${C.muted}`}>Coleção encerrada · peças migradas para a Linha Permanente</span>}
                    {v === VISAO_GERAL && <span className={`mt-1 text-xs ${C.muted}`}>Peças permanentes, fora do período de lançamento</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--mz-line)] p-4">
            <p className="mz-eyebrow">Demonstração</p>
            {LANCAMENTOS.map((l) => (
              <div key={l.nome} className="mt-2">
                {encerradas.includes(l.nome) ? (
                  <button type="button" onClick={() => onDesfazerExpiracao(l.nome)} className={`${C.btnGhost} w-full !py-2 text-xs`}>
                    Desfazer simulação · reativar {l.nome}
                  </button>
                ) : (
                  <button type="button" onClick={() => onSimularExpiracao(l.nome)} className={`${C.btnPrimary} w-full !py-2 text-xs`}>
                    Simular expiração (90 dias) · {l.nome}
                  </button>
                )}
              </div>
            ))}
            <p className={`mt-2 text-[11px] leading-snug ${C.muted}`}>Encerra a coleção e migra as peças exclusivas para o Catálogo Geral / Linha.</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-[color:var(--mz-line)] bg-[color:var(--mz-soft)] px-5 py-5">
          <div>
            <p className="mz-eyebrow">Representante</p>
            <p className="mt-1 font-medium">{rep.nome} <span className={`mz-mono text-xs ${C.muted}`}>{rep.codigo}</span></p>
            <p className={`text-sm ${C.muted}`}>{rep.regiao}</p>
          </div>
          <div>
            <p className="mz-eyebrow">Cliente / Fábrica</p>
            {cliente ? (
              <>
                <p className="mt-1 font-medium">{cliente.nome}</p>
                <p className={`text-sm ${C.muted}`}>{cliente.contato} · {cliente.cidade}</p>
              </>
            ) : (
              <p className={`mt-1 text-sm ${C.muted}`}>{apresentacao ? "Modo Apresentação · sem cliente selecionado." : "Nenhuma fábrica selecionada."}</p>
            )}
            <button type="button" onClick={onTrocarCliente} className={`mz-focus -ml-1 mt-1 min-h-[44px] px-1 text-sm font-bold underline underline-offset-4 ${C.accentText}`}>
              {cliente ? "Trocar cliente" : "Escolher cliente"}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <button type="button" onClick={onTrocarModo} className={`mz-focus min-h-[44px] text-sm font-semibold ${C.muted} hover:text-[color:var(--mz-ink)]`}>
              Trocar modo de acesso
            </button>
            <button type="button" onClick={onSair} className={`mz-focus min-h-[44px] text-sm font-semibold ${C.muted} hover:text-[color:var(--mz-ink)]`}>
              Sair da conta
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

/* ----------------------------- carrossel de destaques ----------------------------- */

const SLIDES = [
  {
    id: "verao",
    eyebrow: "Coleção Verão 2026",
    titulo: "Lançamentos em Metais e Texturas",
    texto: "Lançamento exclusivo: enfeites e passadores com o brilho do dourado e superfícies esculpidas à mão.",
    cta: "Ver o lançamento Verão",
    colecao: "Verão 2026",
    lancamento: "Verão 2026",
    fotos: ["EF 1170", "PS 1030", "EF 661"],
    estilo: { background: "linear-gradient(140deg, #18325A 0%, #203F6E 55%, #2C5596 100%)", color: "#FFFFFF" },
    suave: "#C9D5EA",
    botao: { background: "#FFFFFF", color: "#203F6E" },
  },
  {
    id: "inverno",
    eyebrow: "Catálogo Geral • Linha Permanente",
    titulo: "Clássicos de Linha, Sempre à Mão",
    texto: "Volumes encorpados, cabochões profundos e passadores de presença, prontos para amostra e produção.",
    cta: "Ver a linha permanente",
    colecao: VISAO_GERAL,
    fotos: ["EF 1150", "PS 1027", "EF 1143"],
    estilo: { background: "#F1F5F9", color: "#0F172A" },
    suave: "#475569",
    botao: { background: "#203F6E", color: "#FFFFFF" },
  },
];

function HeroCarrossel({ ativas, onVerColecao }) {
  // Lançamento encerrado: o slide passa a levar para a Linha Permanente
  const slides = SLIDES.map((sl) =>
    sl.lancamento && !ativas.has(sl.lancamento)
      ? { ...sl, eyebrow: `${sl.lancamento} · coleção encerrada`, texto: "As peças desta coleção agora fazem parte do Catálogo Geral / Linha Permanente.", cta: "Ver na linha permanente", colecao: VISAO_GERAL }
      : sl
  );
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const toqueX = useRef(null);
  const total = slides.length;
  const ir = (i) => setAtual((i + total) % total);

  useEffect(() => {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (pausado || reduzir) return undefined;
    const t = setInterval(() => setAtual((i) => (i + 1) % total), 7000);
    return () => clearInterval(t);
  }, [pausado, total]);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques do showroom"
      className="relative overflow-hidden"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => { toqueX.current = e.touches[0].clientX; setPausado(true); }}
      onTouchEnd={(e) => {
        const dx = toqueX.current == null ? 0 : e.changedTouches[0].clientX - toqueX.current;
        if (Math.abs(dx) > 45) ir(atual + (dx < 0 ? 1 : -1));
        toqueX.current = null;
      }}
    >
      <div className="grid">
        {slides.map((sl, i) => {
          const ativo = i === atual;
          return (
            <div
              key={sl.id}
              className="mz-slide"
              aria-hidden={!ativo}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}: ${sl.eyebrow}`}
              style={sl.estilo}
            >
              <div className="mz-gutter mx-auto grid max-w-7xl items-center gap-6 pb-20 pt-7 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pb-20 md:pt-12">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: sl.suave }}>
                    <span className="mz-mono mr-2">{String(i + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
                    {sl.eyebrow}
                  </p>
                  <h2 className="mz-display mt-3 text-[30px] leading-[1.1] sm:text-5xl">{sl.titulo}</h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: sl.suave }}>{sl.texto}</p>
                  <button
                    type="button"
                    tabIndex={ativo ? 0 : -1}
                    onClick={() => onVerColecao(sl.colecao)}
                    className="mz-focus mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-[15px] font-bold transition active:scale-[.98]"
                    style={sl.botao}
                  >
                    {sl.cta} <span aria-hidden="true">→</span>
                  </button>
                </div>

                <div className="grid grid-cols-[1.3fr_1fr] gap-2.5">
                  {sl.fotos.map((ref, k) => {
                    const prod = PRODUTOS.find((x) => x.ref === ref);
                    return (
                      <figure key={ref} className={`flex flex-col ${k === 0 ? "row-span-2" : ""}`}>
                        <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl" style={{ background: fundoDaFoto(prod) }}>
                          <ImagemPeca produto={prod} alturaMax={k === 0 ? 280 : 130} />
                        </div>
                        <figcaption className="mz-ref mt-1 text-[10px]" style={{ color: sl.suave }}>{rotuloRef(prod)}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mz-gutter pointer-events-none absolute inset-x-0 bottom-3 mx-auto flex max-w-7xl items-center justify-between">
        <div className="pointer-events-auto flex items-center" role="tablist" aria-label="Escolher destaque">
          {slides.map((sl, i) => (
            <button
              key={sl.id}
              type="button"
              role="tab"
              aria-selected={i === atual}
              aria-label={`Destaque ${i + 1}: ${sl.eyebrow}`}
              onClick={() => ir(i)}
              className="mz-focus flex h-11 items-center px-1.5"
            >
              <span
                className="block h-2 rounded-full transition-all"
                style={{ width: i === atual ? 26 : 8, background: slides[atual].estilo.color, opacity: i === atual ? 1 : 0.35 }}
              />
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-2">
          {[["Destaque anterior", ChevronLeft, -1], ["Próximo destaque", ChevronRight, 1]].map(([rotulo, Ico, d]) => (
            <button
              key={rotulo}
              type="button"
              aria-label={rotulo}
              onClick={() => ir(atual + d)}
              className="mz-focus flex h-11 w-11 items-center justify-center rounded-full border-2 transition active:scale-95"
              style={{ borderColor: slides[atual].estilo.color, color: slides[atual].estilo.color }}
            >
              <Ico className="h-5 w-5" strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- modo de acesso ----------------------------- */

function TelaModo({ rep, onAtendimento, onApresentacao }) {
  const primeiroNome = rep.nome.split(" ")[0];
  const opcoes = [
    {
      id: "atendimento",
      numero: "01",
      titulo: "Atendimento a Cliente",
      texto: "Escolha a fábrica (ou cadastre um novo cliente PJ) e siga para o catálogo com carrinho e pedidos liberados.",
      acao: "Escolher a fábrica",
      onClick: onAtendimento,
      destaque: true,
    },
    {
      id: "apresentacao",
      numero: "02",
      titulo: "Apenas Mostrar Catálogo",
      texto: "Modo Apresentação: folheie as coleções com estilistas e modelistas, sem cliente e sem compromisso de pedido.",
      acao: "Abrir a vitrine",
      onClick: onApresentacao,
    },
  ];
  return (
    <main className="mz-gutter mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center py-8">
      <div className="mz-in">
        <p className="mz-eyebrow">Metaliza · {rep.regiao}</p>
        <h1 className="mz-display mt-2 text-[28px] leading-tight sm:text-5xl">Olá, {primeiroNome}. Como será esta visita?</h1>
        <p className={`mt-3 max-w-xl text-[15px] ${C.muted}`}>
          Você pode trocar de modo a qualquer momento pelo menu. No modo apresentação, o cliente é pedido só quando você for montar o pedido.
        </p>
      </div>
      <div className="mt-7 grid gap-3 md:grid-cols-2 md:gap-4">
        {opcoes.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={o.onClick}
            className={`mz-focus group flex flex-col gap-4 rounded-3xl border-2 p-5 text-left transition active:scale-[.99] sm:min-h-[15rem] sm:justify-between sm:p-7 ${
              o.destaque
                ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent)] text-white shadow-[0_14px_30px_-16px_rgba(32,63,110,.8)]"
                : "border-[color:var(--mz-line)] bg-white hover:border-[color:var(--mz-accent)]"
            }`}
          >
            <span className={`mz-mono flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${o.destaque ? "bg-white/15" : "bg-[color:var(--mz-accent-soft)] text-[color:var(--mz-accent)]"}`}>{o.numero}</span>
            <span>
              <span className="block text-[22px] font-extrabold leading-tight tracking-tight sm:text-3xl">{o.titulo}</span>
              <span className={`mt-2 block max-w-sm text-sm leading-relaxed ${o.destaque ? "text-white/80" : C.muted}`}>{o.texto}</span>
            </span>
            <span className={`inline-flex min-h-[44px] items-center gap-2 self-start rounded-xl px-4 text-sm font-bold transition group-hover:gap-3 ${o.destaque ? "bg-white text-[color:var(--mz-accent)]" : "bg-[color:var(--mz-accent)] text-white"}`}>
              {o.acao} <span aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

function ModalEscolherCliente({ pendente, clientes, historico, onSelecionar, onCadastrar, onFechar }) {
  const fecharRef = useRef(null);
  const arrastar = useArrastarParaFechar(onFechar);
  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);
  const prod = pendente && PRODUTOS.find((x) => x.ref === pendente.ref);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div role="dialog" aria-modal="true" aria-label="Para iniciar o pedido, selecione o cliente que está atendendo" className="mz-sheet relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl sm:rounded-3xl">
        <AlcaSheet arrastar={arrastar} />
        <button ref={fecharRef} type="button" onClick={onFechar} aria-label="Fechar seleção de cliente" className={`${C.fechar} absolute right-2 top-2 z-10`}>
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
        <TelaClientes
          como="div"
          className="px-4 pb-8 pt-3 sm:px-8 sm:pt-8"
          clientes={clientes}
          historico={historico}
          onSelecionar={onSelecionar}
          onCadastrar={onCadastrar}
          eyebrow="Modo Apresentação · Iniciar pedido"
          titulo="Para iniciar o pedido, selecione o cliente que está atendendo"
          subtitulo={pendente ? "A peça abaixo entra no carrinho assim que você escolher o cliente." : "Escolha a fábrica para abrir o pedido."}
          topo={
            pendente && (
              <div className="mb-5 mr-10 flex items-center gap-3 rounded-2xl border border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)] p-3 sm:mr-12">
                <ImagemPeca produto={prod} miniatura />
                <div className="min-w-0">
                  <p className="mz-eyebrow">Peça aguardando · {TIPO_LABEL[pendente.tipo]}</p>
                  <p className="mt-1 text-sm font-medium">{linhaPedido(prod, pendente)}</p>
                </div>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- cadastro completo de cliente PJ ----------------------------- */

const FORM_CLIENTE_VAZIO = {
  cnpj: "", ie: "", razaoSocial: "", fantasia: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", municipio: "", uf: "",
  contato: "", whatsapp: "", email: "",
};
const MASCARAS_CLIENTE = { cnpj: mascaraCnpj, cep: mascaraCep, whatsapp: mascaraWhatsapp };
// Ordem dos campos no formulário, para levar o foco ao primeiro com erro
const ORDEM_CAMPOS_CLIENTE = ["cnpj", "ie", "razaoSocial", "fantasia", "cep", "logradouro", "numero", "complemento", "bairro", "municipio", "uf", "contato", "whatsapp", "email"];

function validarCliente(form, clientes) {
  const e = {};
  if (!somenteDigitos(form.cnpj)) e.cnpj = "Informe o CNPJ.";
  else if (!cnpjValido(form.cnpj)) e.cnpj = "CNPJ inválido. Confira os 14 dígitos.";
  else {
    const dup = clientes.find((c) => c.cnpj && somenteDigitos(c.cnpj) === somenteDigitos(form.cnpj));
    if (dup) e.cnpj = `CNPJ já cadastrado para ${dup.nome}.`;
  }
  if (!form.ie.trim()) e.ie = "Informe a Inscrição Estadual.";
  if (!form.razaoSocial.trim()) e.razaoSocial = "Informe a razão social.";
  if (somenteDigitos(form.cep).length !== 8) e.cep = "CEP com 8 dígitos, ex.: 93510-120.";
  if (!form.logradouro.trim()) e.logradouro = "Informe a rua / logradouro.";
  if (!form.numero.trim()) e.numero = "Informe o número (ou S/N).";
  if (!form.bairro.trim()) e.bairro = "Informe o bairro.";
  if (!form.municipio.trim()) e.municipio = "Informe a cidade.";
  if (!form.uf) e.uf = "Selecione a UF.";
  if (!form.contato.trim()) e.contato = "Informe o comprador / contato.";
  if (somenteDigitos(form.whatsapp).length < 10) e.whatsapp = "Telefone com DDD, ex.: (51) 99999-0000.";
  if (!form.email.trim()) e.email = "Informe o e-mail de faturamento.";
  else if (!emailValido(form.email)) e.email = "E-mail inválido.";
  return e;
}

function SecaoCadastro({ numero, titulo, children }) {
  return (
    <fieldset className="rounded-2xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-4 sm:p-5">
      <legend className="sr-only">{titulo}</legend>
      <p className="mz-eyebrow flex items-center gap-2" aria-hidden="true">
        <span className="mz-mono text-[color:var(--mz-accent)]">{numero}</span> {titulo}
      </p>
      <div className="mt-4 grid grid-cols-6 gap-x-3 gap-y-4">{children}</div>
    </fieldset>
  );
}

function ModalCadastroCliente({ clientes, onSalvar, onFechar }) {
  const [form, setForm] = useState(FORM_CLIENTE_VAZIO);
  const [erros, setErros] = useState({});
  const primeiroRef = useRef(null);

  useEffect(() => {
    primeiroRef.current?.focus();
    // Captura o Esc antes do modal de seleção de cliente (quando o cadastro abre por cima dele)
    const esc = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onFechar();
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [onFechar]);

  const alterar = (chave, valor) => {
    const mascara = MASCARAS_CLIENTE[chave];
    setForm((f) => ({ ...f, [chave]: mascara ? mascara(valor) : valor }));
    setErros((er) => ({ ...er, [chave]: undefined }));
  };

  const salvar = (e) => {
    e.preventDefault();
    const novos = validarCliente(form, clientes);
    setErros(novos);
    const primeiro = ORDEM_CAMPOS_CLIENTE.find((k) => novos[k]);
    if (primeiro) {
      document.getElementById(`mz-cli-${primeiro}`)?.focus();
      return;
    }
    const t = (k) => form[k].trim();
    const municipio = t("municipio");
    onSalvar({
      id: `c${Date.now()}`,
      nome: t("fantasia") || t("razaoSocial"),
      fantasia: t("fantasia") || t("razaoSocial"),
      razaoSocial: t("razaoSocial"),
      cnpj: form.cnpj,
      ie: t("ie"),
      cep: form.cep,
      logradouro: t("logradouro"),
      numero: t("numero"),
      complemento: t("complemento"),
      bairro: t("bairro"),
      municipio,
      uf: form.uf,
      cidade: `${municipio}/${form.uf}`,
      contato: t("contato"),
      whatsapp: form.whatsapp,
      email: t("email").toLowerCase(),
      ultimoPedido: null,
      novo: true,
    });
  };

  const qtdErros = Object.values(erros).filter(Boolean).length;
  const classeInput = (chave) => `${C.input} ${erros[chave] ? "border-[color:var(--mz-warn)] bg-[color:var(--mz-warn-soft)]" : ""}`;

  const Rotulo = ({ chave, texto, obrigatorio = true }) => (
    <label htmlFor={`mz-cli-${chave}`} className="text-sm font-semibold">
      {texto}
      {obrigatorio ? <span className="text-[color:var(--mz-warn)]" aria-hidden="true"> *</span> : <span className={`font-normal ${C.muted}`}> (opcional)</span>}
    </label>
  );
  const Erro = ({ chave }) =>
    erros[chave] ? <span id={`mz-cli-${chave}-erro`} className="text-xs font-medium text-[color:var(--mz-warn)]">{erros[chave]}</span> : null;

  const campo = (chave, texto, { col = "col-span-6", obrigatorio = true, ...extra } = {}) => (
    <div className={`flex min-w-0 flex-col gap-1.5 ${col}`}>
      <Rotulo chave={chave} texto={texto} obrigatorio={obrigatorio} />
      <input
        id={`mz-cli-${chave}`}
        className={classeInput(chave)}
        value={form[chave]}
        onChange={(e) => alterar(chave, e.target.value)}
        aria-required={obrigatorio}
        aria-invalid={!!erros[chave]}
        aria-describedby={erros[chave] ? `mz-cli-${chave}-erro` : undefined}
        {...extra}
      />
      <Erro chave={chave} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mz-cadastro-titulo"
        className="mz-sheet flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[color:var(--mz-soft)] shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--mz-line)] bg-white px-5 pb-3 pt-4">
          <div className="min-w-0">
            <p className="mz-eyebrow">Cadastro de cliente · Pessoa Jurídica</p>
            <h2 id="mz-cadastro-titulo" className="mz-display text-lg font-bold">Novo cliente</h2>
            <p className={`text-xs ${C.muted}`}>Dados usados pela fábrica para faturar o pedido. Campos com <span className="text-[color:var(--mz-warn)]">*</span> são obrigatórios.</p>
          </div>
          <button type="button" onClick={onFechar} className={`${C.fechar} -mr-2`} aria-label="Fechar cadastro">
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <form id="mz-form-cliente" onSubmit={salvar} noValidate className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <SecaoCadastro numero="01" titulo="Identificação da empresa">
            {campo("cnpj", "CNPJ", { col: "col-span-6 sm:col-span-3", placeholder: "00.000.000/0000-00", inputMode: "numeric", autoComplete: "off", ref: primeiroRef })}
            {campo("ie", "Inscrição Estadual", { col: "col-span-6 sm:col-span-3", placeholder: "Nº da IE", inputMode: "numeric", autoComplete: "off" })}
            {campo("razaoSocial", "Razão Social", { placeholder: "Ex.: Lírio Indústria de Calçados Ltda.", autoComplete: "organization" })}
            {campo("fantasia", "Nome Fantasia", { obrigatorio: false, placeholder: "Ex.: Calçados Lírio" })}
          </SecaoCadastro>

          <SecaoCadastro numero="02" titulo="Endereço de faturamento / entrega">
            {campo("cep", "CEP", { col: "col-span-6 sm:col-span-2", placeholder: "00000-000", inputMode: "numeric", autoComplete: "postal-code" })}
            {campo("logradouro", "Logradouro / Rua", { col: "col-span-6 sm:col-span-4", placeholder: "Ex.: Rua Primeiro de Maio", autoComplete: "address-line1" })}
            {campo("numero", "Número", { col: "col-span-2", placeholder: "Nº", autoComplete: "off" })}
            {campo("complemento", "Complemento", { col: "col-span-4", obrigatorio: false, placeholder: "Sala, pavilhão…", autoComplete: "address-line2" })}
            {campo("bairro", "Bairro", { placeholder: "Ex.: Centro" })}
            {campo("municipio", "Cidade", { col: "col-span-4", placeholder: "Ex.: Sapiranga", autoComplete: "address-level2" })}
            <div className="col-span-2 flex min-w-0 flex-col gap-1.5">
              <Rotulo chave="uf" texto="UF" />
              <select
                id="mz-cli-uf"
                className={`${classeInput("uf")} px-2`}
                value={form.uf}
                onChange={(e) => alterar("uf", e.target.value)}
                autoComplete="address-level1"
                aria-required="true"
                aria-invalid={!!erros.uf}
                aria-describedby={erros.uf ? "mz-cli-uf-erro" : undefined}
              >
                <option value="">UF</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              <Erro chave="uf" />
            </div>
          </SecaoCadastro>

          <SecaoCadastro numero="03" titulo="Contato comercial e financeiro">
            {campo("contato", "Comprador / Contato", { placeholder: "Ex.: Ana Paula (compras)", autoComplete: "name" })}
            {campo("whatsapp", "Telefone / WhatsApp comercial", { col: "col-span-6 sm:col-span-3", placeholder: "(00) 00000-0000", inputMode: "tel", autoComplete: "tel" })}
            {campo("email", "E-mail (faturamento / XML / pedido)", { col: "col-span-6 sm:col-span-3", placeholder: "nfe@empresa.com.br", type: "email", inputMode: "email", autoComplete: "email" })}
          </SecaoCadastro>
        </form>

        <div className="border-t border-[color:var(--mz-line)] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 sm:px-5">
          {qtdErros > 0 && (
            <p role="alert" className="mb-2 text-sm font-semibold text-[color:var(--mz-warn)]">
              Preencha {qtdErros === 1 ? "o campo destacado" : `os ${qtdErros} campos destacados`} para salvar.
            </p>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" onClick={onFechar} className={C.btnGhost}>Cancelar</button>
            <button type="submit" form="mz-form-cliente" className={C.btnAccent}>Salvar e atender</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- tela 2: clientes ----------------------------- */

function TelaClientes({
  clientes,
  historico,
  onSelecionar,
  onCadastrar,
  como: Tag = "main",
  eyebrow = "Atendimento · Cliente",
  titulo = "Para qual fábrica é este atendimento?",
  subtitulo = "O catálogo abre depois que você escolhe o cliente.",
  topo = null,
  className = "mz-gutter mx-auto max-w-6xl py-8",
}) {
  const [abrirCadastro, setAbrirCadastro] = useState(false);

  return (
    <Tag className={className}>
      {topo}
      <div className="mz-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mz-eyebrow">{eyebrow}</p>
          <h1 className="mz-display mt-1 text-2xl font-bold sm:text-3xl">{titulo}</h1>
          <p className={`mt-1 text-sm ${C.muted}`}>{subtitulo}</p>
        </div>
        <button type="button" onClick={() => setAbrirCadastro(true)} className={`${C.btnGhost} w-full sm:w-auto`} aria-haspopup="dialog">
          <Icone.mais className="h-4 w-4" /> Cadastrar Novo Cliente (PJ)
        </button>
      </div>

      {abrirCadastro && (
        <ModalCadastroCliente
          clientes={clientes}
          onFechar={() => setAbrirCadastro(false)}
          onSalvar={(c) => {
            setAbrirCadastro(false);
            onCadastrar(c);
          }}
        />
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c) => {
          const enviados = historico.filter((h) => h.clienteId === c.id).length;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelecionar(c)}
                className="mz-focus group flex h-full w-full flex-col gap-4 rounded-2xl border-2 border-[color:var(--mz-line)] bg-white p-4 text-left transition hover:border-[color:var(--mz-accent)] active:scale-[.99] sm:p-5"
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
                  {c.razaoSocial && c.razaoSocial !== c.nome && <p className={`truncate text-xs ${C.muted}`}>{c.razaoSocial}</p>}
                  {c.cnpj && <p className={`mz-mono mt-0.5 text-xs ${C.muted}`}>CNPJ {c.cnpj}</p>}
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
                <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[color:var(--mz-accent-soft)] text-sm font-bold text-[color:var(--mz-accent)] transition group-hover:bg-[color:var(--mz-accent)] group-hover:text-white">Atender este cliente →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Tag>
  );
}

/* ----------------------------- tela 3: catálogo ----------------------------- */

function Chips({ titulo, opcoes, valor, onChange, idBase, contar }) {
  return (
    <div className="min-w-0">
      <p className="mz-eyebrow mb-2" id={`${idBase}-rotulo`}>{titulo}</p>
      <div className="mz-scroll-x -mx-4 flex gap-2 px-4 pb-1" role="radiogroup" aria-labelledby={`${idBase}-rotulo`}>
        {opcoes.map((o) => {
          const ativo = o === valor;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onChange(o)}
              className={`mz-focus inline-flex min-h-[44px] shrink-0 items-center rounded-full border-2 px-4 text-sm font-semibold transition active:scale-95 ${
                ativo
                  ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent)] text-white"
                  : "border-[color:var(--mz-line)] bg-white text-[color:var(--mz-ink-2)] hover:border-[color:var(--mz-accent)]"
              }`}
            >
              {o}
              {contar && <span className={`mz-mono ml-2 text-xs ${ativo ? "text-white/75" : "text-[color:var(--mz-muted)]"}`}>{contar(o)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TelaCatalogo({ cliente, itensPedido, colecao, ativas, onColecao, onAbrirPeca }) {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const vitrineRef = useRef(null);

  const daColecao = useMemo(() => pecasDaVisao(colecao, ativas), [colecao, ativas]);
  const lanc = LANCAMENTOS.find((l) => l.nome === colecao && ativas.has(l.nome));
  const filtrados = useMemo(() => {
    const termo = busca.trim();
    return daColecao.filter(
      (p) =>
        (categoria === "Todos" || p.categoria === categoria) &&
        (!termo || normalizarRef(p.ref).includes(normalizarRef(termo)))
    );
  }, [daColecao, categoria, busca]);

  const refsNoPedido = useMemo(() => new Set(itensPedido.map((i) => i.ref)), [itensPedido]);
  const limpar = () => { setCategoria("Todos"); setBusca(""); };
  const filtrosAtivos = categoria !== "Todos" || busca;

  const verColecao = (c) => {
    onColecao(c);
    limpar();
    vitrineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="pb-32">
      <HeroCarrossel ativas={ativas} onVerColecao={verColecao} />

      <section ref={vitrineRef} className="mz-gutter mx-auto max-w-7xl scroll-mt-28 pt-7" aria-labelledby="mz-vitrine-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
          <div className="min-w-0">
            <p className="mz-eyebrow">{cliente ? `Vitrine · Atendendo ${cliente.nome}` : "Vitrine · Modo Apresentação"}</p>
            <h1 id="mz-vitrine-titulo" className="mz-display mt-1 text-[26px] leading-tight sm:text-4xl">{colecao}</h1>
            <p className={`mt-1.5 text-sm ${C.muted}`}>
              {lanc
                ? <>🔥 Lançamento exclusivo · restam <b className="font-medium text-[color:var(--mz-ink)]">{diasRestantes(lanc)} dias</b> · </>
                : "Linha permanente · peças fora do período de lançamento · "}
              {daColecao.length} referências · fotos originais em Ouro Light
            </p>
          </div>
          <label htmlFor="mz-busca" className="relative w-full sm:w-80">
            <span className="sr-only">Buscar por referência</span>
            <Icone.busca className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${C.muted}`} />
            <input
              id="mz-busca"
              type="search"
              className={`${C.input} pl-11`}
              placeholder="Buscar referência (EF 1170)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
        </div>

        <div className="pb-4">
          <Chips titulo="Categoria" opcoes={CATEGORIAS} valor={categoria} onChange={setCategoria} idBase="mz-cat" contar={(o) => daColecao.filter((p) => o === "Todos" || p.categoria === o).length} />
        </div>

        <div className={`flex min-h-[44px] items-center justify-between border-t border-[color:var(--mz-line)] pb-3 pt-1 text-sm ${C.muted}`}>
          <span><b className="font-bold text-[color:var(--mz-ink)]">{filtrados.length}</b> de {daColecao.length} referências</span>
          {filtrosAtivos && <button type="button" onClick={limpar} className={`mz-focus min-h-[44px] px-1 font-bold underline underline-offset-4 ${C.accentText}`}>Limpar filtros</button>}
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--mz-line)] p-8 text-center">
            <p className="mz-display text-xl">Nenhuma peça com esses filtros.</p>
            <p className={`mt-2 text-sm ${C.muted}`}>Tente outra categoria, outra coleção no menu ou confira o código da referência.</p>
            <button type="button" onClick={limpar} className={`${C.btnGhost} mt-5`}>Limpar filtros</button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <CardProduto key={p.ref} produto={p} ativas={ativas} noPedido={refsNoPedido.has(p.ref)} onAbrir={onAbrirPeca} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function CardProduto({ produto: p, ativas, noPedido, onAbrir }) {
  const lanc = emLancamento(p, ativas);
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => onAbrir(p)}
        className="mz-focus group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[color:var(--mz-line)] bg-white text-left transition hover:border-[color:var(--mz-accent)] hover:shadow-[var(--mz-shadow)] active:scale-[.98]"
      >
        <div className="relative flex h-36 w-full items-center justify-center sm:h-52" style={{ background: fundoDaFoto(p) }}>
          <ImagemPeca produto={p} alturaMax="100%" className="h-full" />
          {noPedido && (
            <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[color:var(--mz-ok)] px-2 py-0.5 text-[10px] font-bold text-white">
              <Icone.check className="h-3 w-3" /> No pedido
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="mz-ref text-[15px] leading-tight text-[color:var(--mz-ink)]">{rotuloRef(p)}</p>
          <p className={`text-xs ${C.muted}`}>
            {categoriaPeca(p)}
          </p>
          <span
            className={`mt-auto self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              lanc ? "bg-[color:var(--mz-accent-soft)] text-[color:var(--mz-accent)]" : "bg-[color:var(--mz-sunken)] text-[color:var(--mz-ink-2)]"
            }`}
          >
            {lanc ? p.colecao : "Linha permanente"}
          </span>
        </div>
      </button>
    </li>
  );
}

/* ----------------------------- tela 4: modal da peça ----------------------------- */

function BotaoCor({ a, ativo, titulo, onClick, largo = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={`${titulo}: ${rotuloAcabamentoComCodigo(a.id)}`}
      className={`mz-focus flex min-h-[56px] min-w-0 items-center gap-2 rounded-xl border-2 p-2 transition active:scale-95 ${largo ? "text-left" : "flex-col text-center"} ${
        ativo ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)]" : "border-[color:var(--mz-line)] hover:border-[color:var(--mz-ink)]"
      }`}
    >
      <span className="relative shrink-0">
        <Swatch acabamento={a} size={largo ? "h-9 w-9" : "h-10 w-10"} />
        {ativo && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--mz-accent)] text-[color:var(--mz-on-accent)]">
            <Icone.check className="h-3 w-3" />
          </span>
        )}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block font-semibold ${largo ? "text-xs" : "text-[11px]"}`}>
          <span className="mz-mono mr-0.5 rounded bg-[color:var(--mz-ink)] px-1 text-[10px] font-bold text-[color:var(--mz-bg)]">{a.codigo}</span> {a.nome}
        </span>
        {largo && a.detalhe && <span className="block text-[11px] text-[color:var(--mz-muted)]">{a.detalhe}</span>}
      </span>
    </button>
  );
}

function SeletorAcabamento({ titulo, valor, onChange, produto, idBase }) {
  const atual = acabamentoPorId(valor);
  const [termo, setTermo] = useState(atual.codigo);
  const [resultado, setResultado] = useState({ tipo: "achado", acabamento: atual });
  // Quando a cor muda pela cartela, o campo passa a mostrar o código dela.
  // Se o texto digitado já aponta para a cor selecionada (ex.: "ouro queimado"), ele é mantido.
  useEffect(() => {
    const r = buscarAcabamento(termo);
    if (r.tipo === "achado" && r.acabamento.id === atual.id) return;
    setTermo(atual.codigo);
    setResultado({ tipo: "achado", acabamento: atual });
  }, [atual.id]);

  const buscar = (v) => {
    const texto = v.slice(0, 24);
    setTermo(texto);
    const r = buscarAcabamento(texto);
    setResultado(r);
    if (r.tipo === "achado" && r.acabamento.id !== valor) onChange(r.acabamento.id);
  };

  const ajuda = {
    vazio: "Digite o código (ex.: 6 ou 1554) ou o nome da cor.",
    parcial: "Continue digitando…",
    achado: `Selecionado: [${atual.codigo}] ${atual.nome}`,
    inexistente: `Nenhuma cor com "${termo.trim()}".`,
    varios: `Várias cores com "${termo.trim()}": ${(resultado.opcoes || []).map((a) => `[${a.codigo}] ${a.nome}`).join(", ")}.`,
  }[resultado.tipo];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mz-eyebrow mb-3">
        {titulo} · <span className="text-[color:var(--mz-ink)]">[{atual.codigo}] {atual.nome}</span>
      </legend>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idBase}-codigo`} className="text-xs font-semibold">Buscar cor por código ou nome</label>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-[16rem]">
            <Icone.busca className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${C.muted}`} />
            <input
              id={`${idBase}-codigo`}
              type="search"
              autoComplete="off"
              className={`${C.input} mz-mono pl-10 font-bold ${resultado.tipo === "inexistente" ? "border-[color:var(--mz-warn)]" : ""}`}
              placeholder="Código da cor (ex: 6)"
              aria-describedby={`${idBase}-codigo-ajuda`}
              value={termo}
              onFocus={(e) => e.target.select()}
              onChange={(e) => buscar(e.target.value)}
            />
          </div>
        </div>
        <span
          id={`${idBase}-codigo-ajuda`}
          aria-live="polite"
          className={`text-xs ${resultado.tipo === "inexistente" ? "font-semibold text-[color:var(--mz-warn)]" : C.muted}`}
        >
          {ajuda}
        </span>
      </div>

      {atual.oculta && (
        <div className="mz-in">
          <p className={`mb-1.5 text-[11px] font-semibold ${C.muted}`}>Cor encontrada pelo código · fora da cartela padrão</p>
          <div className="grid grid-cols-2">
            <BotaoCor a={atual} ativo titulo={titulo} largo onClick={() => {}} />
          </div>
        </div>
      )}

      {GRUPOS_ACABAMENTO.map((g) => (
        <div key={g.id}>
          <p className={`mb-1.5 text-[11px] font-semibold ${C.muted}`}>
            {g.titulo}
          </p>
          <div className={`grid gap-2 ${g.id === "bicolor" ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-5"}`}>
            {ACABAMENTOS.filter((a) => a.grupo === g.id && !a.oculta).map((a) => (
              <BotaoCor key={a.id} a={a} ativo={a.id === valor} titulo={titulo} largo={g.id === "bicolor"} onClick={() => onChange(a.id)} />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

function ModalPeca({ produto, semCliente = false, onFechar, onAdicionar }) {
  const [acabamentoId, setAcabamentoId] = useState(ACABAMENTO_PADRAO.id);
  const [comAfra, setComAfra] = useState(false);
  const [afra, setAfra] = useState(null);
  const [tipo, setTipo] = useState("amostra");
  const [qtd, setQtd] = useState(REGRAS.amostra.min);
  const [texto, setTexto] = useState(String(REGRAS.amostra.min));
  const [aviso, setAviso] = useState("");
  const [tremer, setTremer] = useState(0);

  const regra = REGRAS[tipo];
  const arrastar = useArrastarParaFechar(onFechar);
  const descricaoAcabamento = textoAcabamento(acabamentoId);

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
const isCorrente = ehCorrente(produto);
  const [elos, setElos] = useState(2); // Inicia no mínimo de 2 elos
  const [comPonteira, setComPonteira] = useState(false);
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

  const afraPendente = temAfra(produto) && comAfra && !afra;
  const valido = Number(texto || 0) >= regra.min && !afraPendente;
  const rascunho = { afra: comAfra ? afra : null };
  const detalhes = [descricaoAcabamento, textoAfra(produto, rascunho)].filter(Boolean).join(" · ");
  const noMinimo = qtd <= regra.min;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mz-modal-titulo"
        className="mz-sheet flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <AlcaSheet arrastar={arrastar} />
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--mz-line)] px-4 pb-3 pt-1 sm:px-5 sm:pt-4" {...arrastar}>
          <div className="min-w-0">
            <h2 id="mz-modal-titulo" className="mz-ref text-[22px] leading-tight">{rotuloRef(produto)}</h2>
            <p className={`mt-0.5 text-sm ${C.muted}`}>
              Categoria: <b className="text-[color:var(--mz-ink)]">{categoriaPeca(produto)}</b>
            </p>
          </div>
          <button type="button" onClick={onFechar} className={`${C.fechar} -mr-2 -mt-1`} aria-label="Fechar">
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto overscroll-contain md:grid-cols-[1fr_1.1fr]">
          {/* Foto */}
          <div className="flex flex-col gap-3 p-4 sm:p-5 md:border-r md:border-[color:var(--mz-line)]">
            <ImagemPeca produto={produto} alturaMax={300} className="overflow-hidden rounded-2xl" />
            <p className="flex items-start gap-2 rounded-md bg-[color:var(--mz-accent-soft)] px-3 py-2 text-sm font-medium">
              <Swatch acabamento={ACABAMENTO_PADRAO} size="mt-0.5 h-4 w-4" />
              <span>
                Foto de referência em Ouro Light. Selecione o acabamento desejado abaixo:
                <span className={`mt-0.5 block text-xs font-normal ${C.muted}`}>A foto permanece original. O acabamento escolhido fica registrado no pedido.</span>
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {[["Categoria", categoriaPeca(produto)], ["Coleção", produto.colecao && produto.colecao !== "Linha" ? produto.colecao : "Linha permanente"]].map(([k, v]) => (
                <div key={k} className="rounded-md bg-[color:var(--mz-sunken)] px-2.5 py-2">
                  <dt className={C.muted}>{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Configuração */}
          <div className="flex flex-col gap-6 p-4 pb-6 sm:p-5">
            <SeletorAcabamento titulo="Cor do Acabamento" idBase="mz-cor" produto={produto} valor={acabamentoId} onChange={setAcabamentoId} />
            {temAfra(produto) && (
              <fieldset>
                <legend className="mz-eyebrow mb-3">Afra</legend>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-[color:var(--mz-sunken)] p-1" role="radiogroup" aria-label="Afra">
                  {[[false, "Sem Afra"], [true, "Com Afra"]].map(([v, rotulo]) => (
                    <button
                      key={rotulo}
                      type="button"
                      role="radio"
                      aria-checked={comAfra === v}
                      onClick={() => { setComAfra(v); if (!v) setAfra(null); }}
                      className={`mz-focus min-h-[44px] rounded-lg px-3 text-sm font-bold transition ${
                        comAfra === v ? "bg-[color:var(--mz-surface)] text-[color:var(--mz-ink)] shadow-[var(--mz-shadow)]" : C.muted
                      }`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
                {comAfra && (
                  <div className="mz-in mt-3 flex flex-col gap-3">
                    {LINHAS_AFRA.map((linha) => (
                      <div key={linha.titulo}>
                        <p className={`mb-1.5 text-[11px] font-semibold ${C.muted}`}>{linha.titulo}</p>
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8" role="radiogroup" aria-label={linha.titulo}>
                          {linha.codigos.map((c) => (
                            <button
                              key={c}
                              type="button"
                              role="radio"
                              aria-checked={afra === c}
                              aria-label={`Afra ${c}`}
                              onClick={() => setAfra(c)}
                              className={`mz-focus mz-mono min-h-[44px] rounded-xl border-2 text-sm font-bold transition ${
                                afra === c
                                  ? "border-[color:var(--mz-accent)] bg-[color:var(--mz-accent)] text-white"
                                  : "border-[color:var(--mz-line)] hover:border-[color:var(--mz-ink)]"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <p className={`text-xs ${afraPendente ? "font-semibold text-[color:var(--mz-warn)]" : C.muted}`}>
                      {afraPendente ? "Escolha o código da Afra para adicionar ao pedido." : `Afra selecionada: ${afra}`}
                    </p>
                  </div>
                )}
              </fieldset>
            )}
{/* Configurações exclusivas de Corrente (CR) */}
            {isCorrente && (
              <div className="flex flex-col gap-4 rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-sunken)] p-4">
                {/* Quantidade de Elos (2 a 100) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="mz-elos" className="mz-eyebrow">
                      Quantidade de Elos
                    </label>
                    <span className="text-xs font-semibold text-[color:var(--mz-accent)]">
                      (Mín. 2 / Máx. 100 elos)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setElos((e) => Math.max(2, e - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mz-line)] bg-white font-bold text-lg"
                    >
                      -
                    </button>
                    <input
                      id="mz-elos"
                      type="number"
                      min={2}
                      max={100}
                      value={elos}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val)) setElos(2);
                        else setElos(Math.min(100, Math.max(2, val)));
                      }}
                      className="h-10 w-24 rounded-lg border border-[color:var(--mz-line)] bg-white text-center font-bold mz-mono text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setElos((e) => Math.min(100, e + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mz-line)] bg-white font-bold text-lg"
                    >
                      +
                    </button>
                    <span className="text-sm font-medium text-[color:var(--mz-muted)]">
                      elos por corrente
                    </span>
                  </div>
                </div>

                {/* Opção de Ponteiras */}
                <fieldset>
                  <legend className="mz-eyebrow mb-2">Ponteiras</legend>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ponteiras">
                    {[
                      [false, "Sem Ponteira"],
                      [true, "Com Ponteira"],
                    ].map(([v, rotulo]) => (
                      <button
                        key={rotulo}
                        type="button"
                        role="radio"
                        aria-checked={comPonteira === v}
                        onClick={() => setComPonteira(v)}
                        className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          comPonteira === v
                            ? "border-[color:var(--mz-accent)] bg-white text-[color:var(--mz-accent)] shadow-sm"
                            : "border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] text-[color:var(--mz-muted)]"
                        }`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </fieldset>
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
                    className={`mz-focus min-h-[44px] rounded-lg px-3 text-sm font-bold transition ${
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
                  className={`mz-focus flex w-14 items-center justify-center rounded-xl border-2 transition ${
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
                  className={`${C.input} mz-mono min-h-[52px] w-full text-center text-xl font-semibold ${aviso ? "border-[color:var(--mz-warn)]" : ""}`}
                  value={texto}
                  onChange={(e) => digitar(e.target.value)}
                  onBlur={confirmarDigitado}
                  aria-describedby="mz-qtd-aviso"
                />
                <button type="button" onClick={aumentar} aria-label={`Aumentar ${regra.passo}`} className="mz-focus flex w-14 items-center justify-center rounded-xl border-2 border-[color:var(--mz-line)] transition hover:border-[color:var(--mz-ink)]">
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--mz-line)] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_20px_-14px_rgba(15,23,42,.25)] sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Swatch acabamento={acabamentoPorId(acabamentoId)} size="h-6 w-6" />
            <span className="min-w-0 truncate">
              <b className="mz-mono">{valido ? formatarNumero(Number(texto)) : "—"}</b> un · {detalhes} · {TIPO_LABEL[tipo]}
            </span>
          </div>
          {semCliente && <p className={`w-full text-xs ${C.muted} sm:order-last`}>Modo Apresentação: ao adicionar, você escolhe o cliente e a peça entra no pedido dele.</p>}
          <button
    type="button"
    disabled={!valido}
    onClick={() => onAdicionar({
    ref: produto.ref,
    acabamento: acabamentoId,
    afra: temAfra(produto) && comAfra ? afra : null,
    elos: isCorrente ? elos : null,
    comPonteira: isCorrente ? comPonteira : null,
    tipo,
    qtd: Number(texto),
  })}
    className={`${C.btnAccent} min-h-[52px] w-full text-base sm:w-auto`}
  >
    <Icone.sacola className="h-5 w-5" />
    {afraPendente
      ? "Selecione a furação/afra"
      : "Adicionar ao pedido"}
  </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- painel do pedido ----------------------------- */

function LinhaItem({ item, onQtd, onRemover, compacto = false }) {
  const p = PRODUTOS.find((x) => x.ref === item.ref);
  const regra = REGRAS[item.tipo];
  const [aviso, setAviso] = useState("");
  const menos = () => {
    if (item.qtd - regra.passo < regra.min) { setAviso(regra.alerta); return; }
    setAviso(""); onQtd(item.qtd - regra.passo);
  };
  const mais = () => { setAviso(""); onQtd(item.qtd + regra.passo); };

  return (
    <li className="flex gap-3 py-3">
      <ImagemPeca produto={p} miniatura />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="mz-mono text-sm font-bold">{rotuloRef(p)}</p>
            <p className={`text-xs ${C.muted}`}>{textoPeca(p).replace(`${rotuloRef(p)} - `, "")}</p>
            <p className={`flex flex-wrap items-center gap-x-1.5 text-xs ${C.muted}`}>
              <Swatch acabamento={acabamentoPorId(item.acabamento)} size="h-3 w-3" />
              <span className="font-semibold text-[color:var(--mz-ink)]">{textoAcabamento(item.acabamento)}</span>
            </p>
            {(item.elos || item.comPonteira != null || textoAfra(p, item)) && (
              <p className="mt-0.5 flex flex-wrap gap-1">
                {[item.elos ? `${item.elos} elos` : null, item.comPonteira === true ? "Com Ponteira" : item.comPonteira === false ? "Sem Ponteira" : null, textoAfra(p, item)].filter(Boolean).map((t) => (
                  <span key={t} className="mz-mono rounded bg-[color:var(--mz-sunken)] px-1.5 py-0.5 text-[11px] font-semibold">{t}</span>
                ))}
              </p>
            )}
          </div>
          {onRemover && (
            <button type="button" onClick={onRemover} className={`${C.fechar} -mr-2 -mt-2 hover:text-[color:var(--mz-warn)]`} aria-label={`Remover ${rotuloRef(p)}`}>
              <Icone.lixeira className="h-5 w-5" />
            </button>
          )}
        </div>
        {compacto ? (
          <p className="mz-mono mt-1 text-sm font-semibold">{formatarNumero(item.qtd)} un</p>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={menos} aria-label="Diminuir" className={`mz-focus flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[color:var(--mz-line)] ${item.qtd <= regra.min ? "opacity-40" : ""}`}>
              <Icone.menos className="h-4 w-4" />
            </button>
            <span className="mz-mono min-w-[3.5rem] text-center text-sm font-semibold">{formatarNumero(item.qtd)}</span>
            <button type="button" onClick={mais} aria-label="Aumentar" className="mz-focus flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[color:var(--mz-line)]">
              <Icone.mais className="h-4 w-4" />
            </button>
            <span className={`text-xs ${C.muted}`}>un</span>
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
        <span className={`mz-mono text-xs ${C.muted}`}>{formatarNumero(total)} un · {PRAZO[tipo]}</span>
      </div>
      <ul className="divide-y divide-[color:var(--mz-line)]">{children}</ul>
    </section>
  );
}

function PainelPedido({ cliente, itens, onFechar, onQtd, onRemover, onRevisar }) {
  const arrastar = useArrastarParaFechar(onFechar);
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const total = itens.reduce((s, i) => s + i.qtd, 0);
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-900/50 sm:items-stretch sm:justify-end" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="mz-pedido-titulo" className="mz-sheet flex max-h-[90vh] w-full flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:pr-[env(safe-area-inset-right,0px)] sm:pt-[env(safe-area-inset-top,0px)]">
        <AlcaSheet arrastar={arrastar} />
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--mz-line)] px-5 pb-3 pt-1 sm:py-4">
          <div className="min-w-0">
            <p className="mz-eyebrow">Pedido em aberto</p>
            <h2 id="mz-pedido-titulo" className="mz-display truncate text-lg font-bold">{cliente.nome}</h2>
          </div>
          <button type="button" onClick={onFechar} className={`${C.fechar} -mr-2`} aria-label="Fechar pedido">
            <X className="h-6 w-6" strokeWidth={2} />
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
            <span className="mz-mono text-base font-bold">{formatarNumero(total)} un</span>
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
            <dl className="mt-2 grid gap-1.5 text-sm">
              {[
                ["Razão Social", cliente.razaoSocial],
                ["CNPJ", cliente.cnpj, true],
                ["IE", cliente.ie, true],
                ["Endereço", cliente.logradouro ? `${enderecoCliente(cliente)} · CEP ${cliente.cep} · ${cliente.municipio}/${cliente.uf}` : cliente.cidade],
                ["Comprador", cliente.contato],
                ["Telefone", cliente.whatsapp, true],
                ["E-mail", cliente.email],
              ]
                .filter(([, v]) => v)
                .map(([rotulo, valor, mono]) => (
                  <div key={rotulo} className="min-w-0">
                    <dt className={`text-xs ${C.muted}`}>{rotulo}</dt>
                    <dd className={`break-words font-medium ${mono ? "mz-mono" : ""}`}>{valor}</dd>
                  </div>
                ))}
            </dl>
            <p className="mz-eyebrow mt-4">Representante</p>
            <p className="mt-1 text-sm font-semibold">{rep.nome} <span className={`mz-mono text-xs ${C.muted}`}>{rep.codigo}</span></p>
            <p className={`text-sm ${C.muted}`}>{rep.regiao}</p>
          </div>

          <div className="rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-5">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt className={C.muted}>Amostras</dt><dd className="mz-mono font-semibold">{formatarNumero(totalAmostra)} un</dd></div>
              <div className="flex justify-between"><dt className={C.muted}>Produção</dt><dd className="mz-mono font-semibold">{formatarNumero(totalProd)} un</dd></div>
              <div className="flex justify-between border-t border-[color:var(--mz-line)] pt-2"><dt className="font-bold">Total</dt><dd className="mz-mono font-bold">{formatarNumero(total)} un</dd></div>
            </dl>

            {!confirmando ? (
              <button type="button" disabled={!itens.length} onClick={() => setConfirmando(true)} className={`${C.btnAccent} mt-4 w-full`}>
                Enviar solicitação
              </button>
            ) : (
              <div className="mz-in mt-4 rounded-lg border border-[color:var(--mz-accent)] bg-[color:var(--mz-accent-soft)] p-3">
                <p className="text-sm font-semibold">Enviar {itens.length} {itens.length === 1 ? "item" : "itens"} ({formatarNumero(total)} un) para a fábrica?</p>
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
  const { email } = pedido;
  const textoEmail = `Para: ${email.para}\nCc: ${email.cc}\nAssunto: ${email.assunto}\n\n${email.corpo}`;

  // Detecta se está acessando de um iPhone/iPad
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // No iPhone, 'googlegmail:///co' chama diretamente o app nativo do Gmail
  const linkAppGmail = `googlegmail:///co?to=${encodeURIComponent(email.para)}&cc=${encodeURIComponent(email.cc || "")}&subject=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.corpo)}`;

  // No computador/desktop, abre a tela de composição do Gmail Web
  const linkWebGmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.para)}&cc=${encodeURIComponent(email.cc || "")}&su=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.corpo)}`;

  const gmailUrl = isIOS ? linkAppGmail : linkWebGmail;

  return (
    <main className="mz-gutter mx-auto max-w-3xl py-10">
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
        {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"} para <b className="text-[color:var(--mz-ink)]">{pedido.cliente.nome}</b>, registrados em {pedido.data}. Envie o pedido diretamente para o PCP da fábrica via Gmail.
      </p>

      {/* Cartão exclusivo de E-mail via Gmail */}
      <section className="mt-6 flex min-w-0 flex-col rounded-xl border border-[color:var(--mz-line)] bg-[color:var(--mz-surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--mz-line)] pb-4">
          <div>
            <h2 className="mz-display text-lg font-bold">Enviar Pedido ao PCP</h2>
            <p className="text-xs text-[color:var(--mz-muted)]">Disparo direto pelo App do Gmail para digitação no sistema</p>
          </div>
          <span className="rounded-full bg-[color:var(--mz-accent-soft)] px-3 py-1 text-xs font-bold text-[color:var(--mz-accent)]">
            PCP Metaliza
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className={C.muted}>Para:</dt>
          <dd className="mz-mono min-w-0 font-medium break-all">{email.para}</dd>

          <dt className={C.muted}>Cc:</dt>
          <dd className="mz-mono min-w-0 text-xs break-all">{email.cc}</dd>

          <dt className={C.muted}>Assunto:</dt>
          <dd className="min-w-0 font-semibold">{email.assunto}</dd>
        </dl>

        <textarea
          id="mz-email"
          readOnly
          rows={10}
          value={email.corpo}
          aria-label="Corpo do e-mail"
          className={`${C.input} mz-mono mt-4 flex-1 text-xs leading-relaxed`}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={gmailUrl}
            target={isIOS ? undefined : "_blank"}
            rel="noreferrer"
            className={`${C.btnAccent} inline-flex items-center gap-2 text-sm font-semibold`}
          >
            Abrir no App do Gmail
          </a>

          <button
            type="button"
            onClick={() => copiar("mz-email", textoEmail)}
            className={C.btnGhost}
          >
            {copiado === "mz-email" ? (
              <>
                <Icone.check className="h-4 w-4" /> Copiado!
              </>
            ) : (
              "Copiar texto do e-mail"
            )}
          </button>
        </div>
      </section>

      {/* Ações pós-envio */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[color:var(--mz-line)] pt-6">
        <button
          type="button"
          onClick={onNovoMesmoCliente}
          className={C.btnOutline}
        >
          Novo pedido para {pedido.cliente.nome}
        </button>
        <button
          type="button"
          onClick={onTrocarCliente}
          className={C.btnGhost}
        >
          Trocar de cliente
        </button>
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
  const [produtosCarregados, setProdutosCarregados] = useState(false);

  useEffect(() => {
    async function carregarProdutosDoBanco() {
      const supabase = obterSupabase();
      if (!supabase) return; // sem Supabase: mantém o catálogo local
      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true);

        if (error) {
          console.error("Erro ao buscar produtos do Supabase:", error.message);
          return;
        }

        if (data && data.length > 0) {
          // Atualiza a lista com os dados reais do banco
          PRODUTOS = data;
          setProdutosCarregados(true);
          console.log(`Carregadas ${data.length} peças reais do Supabase.`);
        }
      } catch (err) {
        console.error("Falha ao comunicar com Supabase:", err);
      }
    }

    carregarProdutosDoBanco();
  }, []);
  const [itensPorCliente, setItensPorCliente] = useState({});
  const [historico, setHistorico] = useState([]);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [toast, setToast] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modo, setModo] = useState(null); // "atendimento" | "apresentacao"
  const [pendente, setPendente] = useState(null); // peça configurada no modo apresentação, aguardando o cliente
  const [escolhendoCliente, setEscolhendoCliente] = useState(false);
  const [confirmandoTroca, setConfirmandoTroca] = useState(false);
  const [encerradas, setEncerradas] = useState([]);
  const ativas = useMemo(
    () => new Set(LANCAMENTOS.filter((l) => !encerradas.includes(l.nome) && diasRestantes(l) > 0).map((l) => l.nome)),
    [encerradas]
  );
  const [colecao, setColecao] = useState(() => visaoInicial(ativas));

  const itens = (cliente && itensPorCliente[cliente.id]) || [];
  const itensAtuais = itens;
  const setItens = (fn) => setItensPorCliente((m) => ({ ...m, [cliente.id]: fn(m[cliente.id] || []) }));
  const apresentacao = modo === "apresentacao" && !cliente;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const entrar = (r) => { setRep(r); setTela("modo"); };
  const sair = () => {
    setRep(null); setCliente(null); setModo(null); setPendente(null); setEscolhendoCliente(false);
    setPeca(null); setPedidoAberto(false); setMenuAberto(false); setTela("modo");
  };
  const iniciarAtendimento = () => { setModo("atendimento"); setTela("clientes"); window.scrollTo?.(0, 0); };
  const iniciarApresentacao = () => {
    setModo("apresentacao");
    setCliente(null);
    setColecao(visaoInicial(ativas));
    setTela("catalogo");
    window.scrollTo?.(0, 0);
  };
  const trocarModo = () => { setMenuAberto(false); setPedidoAberto(false); setPeca(null); setCliente(null); setTela("modo"); window.scrollTo?.(0, 0); };

  const selecionarCliente = (c) => { setCliente(c); setModo("atendimento"); setColecao(visaoInicial(ativas)); setTela("catalogo"); window.scrollTo?.(0, 0); };

  // Modo apresentação: o cliente escolhido no modal recebe a peça pendente e o app entra em atendimento
  const vincularClienteDoModal = (c) => {
    setCliente(c);
    setModo("atendimento");
    setEscolhendoCliente(false);
    if (pendente) {
      adicionarPara(c.id, pendente);
      const prod = PRODUTOS.find((x) => x.ref === pendente.ref);
      setToast(`Atendendo ${c.nome} · Adicionado: ${linhaPedido(prod, pendente)}`);
      setPendente(null);
    } else {
      setToast(`Atendendo ${c.nome} · Pedido liberado.`);
    }
  };
  const cadastrarClienteDoModal = (c) => {
    setClientes((l) => [c, ...l]);
    vincularClienteDoModal(c);
  };
  const cancelarEscolhaCliente = () => {
    setEscolhendoCliente(false);
    if (pendente) setToast("Peça não adicionada: nenhum cliente selecionado.");
    setPendente(null);
  };
  const cadastrarCliente = (c) => {
    setClientes((l) => [c, ...l]);
    setToast(`${c.nome} cadastrado.`);
    selecionarCliente(c);
  };
  const trocarCliente = (confirmado = false) => {
    if (confirmado !== true && tela !== "enviado" && itens && itens.length > 0) {
      setMenuAberto(false);
      setConfirmandoTroca(true);
      return;
    }
    setConfirmandoTroca(false);
    setPedidoAberto(false);
    setPeca(null);
    setMenuAberto(false);
    if (modo === "apresentacao" && !cliente) { setEscolhendoCliente(true); return; }
    setTela("clientes");
  };
  const simularExpiracao = (nome) => {
    const migradas = PRODUTOS.filter((p) => p.colecao === nome).length;
    setEncerradas((l) => [...new Set([...l, nome])]);
    if (colecao === nome) setColecao(VISAO_GERAL);
    setToast(`${nome} encerrada (90 dias): ${migradas} peças migradas para o Catálogo Geral / Linha.`);
  };
  const desfazerExpiracao = (nome) => {
    setEncerradas((l) => l.filter((n) => n !== nome));
    setColecao(nome);
    setToast(`${nome} reativada para a demonstração.`);
  };
  const escolherColecao = (c) => {
    setColecao(c);
    setMenuAberto(false);
    if (!cliente && modo !== "apresentacao") { setTela("clientes"); setToast("Escolha a fábrica para abrir o catálogo."); return; }
    setTela("catalogo");
    window.scrollTo?.(0, 0);
  };

const adicionarPara = (clienteId, novo) => {
    const chave = [
      novo.ref,
      novo.acabamento,
      novo.afra || "sem-afra",
      novo.elos ? `${novo.elos}elos` : "-",
      novo.comPonteira ? "com-ponteira" : "sem-ponteira",
      novo.tipo,
    ].join("|");

    setItensPorCliente((m) => {
      const lista = m[clienteId] || [];
      const existente = lista.find((i) => i.chave === chave);
      const nova = existente
        ? lista.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + novo.qtd } : i))
        : [...lista, { ...novo, chave }];
      return { ...m, [clienteId]: nova };
    });
  };



  const adicionar = (novo) => {
    setPeca(null);
    // Sem cliente (modo apresentação): guarda a peça e pede o cliente antes de montar o pedido
    if (!cliente) {
      setPendente(novo);
      setEscolhendoCliente(true);
      return;
    }
    adicionarPara(cliente.id, novo);
    const prod = PRODUTOS.find((x) => x.ref === novo.ref);
    setToast(`Adicionado (${TIPO_LABEL[novo.tipo]}): ${linhaPedido(prod, novo)}`);
  };

  const alterarQtd = (chave, q) => setItens((l) => l.map((i) => (i.chave === chave ? { ...i, qtd: q } : i)));
  const remover = (chave) => setItens((l) => l.filter((i) => i.chave !== chave));

  const enviar = () => {
    const numero = gerarNumeroPedido(historico.length + 1);
    // A coleção de cada peça é registrada no momento do envio (lançamento ativo ou linha permanente)
    const itens = itensAtuais.map((i) => ({ ...i, colecao: rotuloColecao(PRODUTOS.find((x) => x.ref === i.ref), ativas) }));
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
            cliente={tela === "clientes" || tela === "modo" ? null : cliente}
            apresentacao={apresentacao && tela === "catalogo"}
            qtdItens={qtdItens}
            onAbrirMenu={() => setMenuAberto(true)}
            onTrocarCliente={trocarCliente}
            onAbrirPedido={() => (cliente ? setPedidoAberto(true) : setEscolhendoCliente(true))}
          />
          {menuAberto && (
            <GavetaMenu
              rep={rep}
              cliente={cliente}
              apresentacao={apresentacao}
              colecao={colecao}
              ativas={ativas}
              encerradas={encerradas}
              onEscolherColecao={escolherColecao}
              onSimularExpiracao={simularExpiracao}
              onDesfazerExpiracao={desfazerExpiracao}
              onTrocarCliente={trocarCliente}
              onTrocarModo={trocarModo}
              onSair={sair}
              onFechar={() => setMenuAberto(false)}
            />
          )}

          {tela === "modo" && <TelaModo rep={rep} onAtendimento={iniciarAtendimento} onApresentacao={iniciarApresentacao} />}
          {tela === "clientes" && (
            <TelaClientes clientes={clientes} historico={historico} onSelecionar={selecionarCliente} onCadastrar={cadastrarCliente} />
          )}
          {tela === "catalogo" && (cliente || apresentacao) && (
            <TelaCatalogo cliente={cliente} itensPedido={itens} colecao={colecao} ativas={ativas} onColecao={setColecao} onAbrirPeca={setPeca} />
          )}
          {tela === "revisao" && cliente && (
            <TelaRevisao rep={rep} cliente={cliente} itens={itens} onVoltar={() => setTela("catalogo")} onQtd={alterarQtd} onRemover={remover} onEnviar={enviar} />
          )}
          {tela === "enviado" && ultimoPedido && (
            <TelaEnviado pedido={ultimoPedido} onNovoMesmoCliente={() => setTela("catalogo")} onTrocarCliente={trocarCliente} />
          )}

          {tela === "catalogo" && (cliente || apresentacao) && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--mz-line)] bg-white/95 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_24px_-18px_rgba(15,23,42,.35)] backdrop-blur">
              <div className="mz-gutter mx-auto flex max-w-7xl items-center gap-3">
                <div className="min-w-0 flex-1 leading-tight">
                  {cliente ? (
                    <>
                      <p className="truncate text-sm font-bold">{cliente.nome}</p>
                      <p className={`text-xs ${C.muted}`}>{qtdItens ? `${qtdItens} ${qtdItens === 1 ? "item" : "itens"} · ${formatarNumero(itens.reduce((s, i) => s + i.qtd, 0))} un` : "Pedido vazio"}</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-bold ${C.accentText}`}>Modo Apresentação</p>
                      <p className={`text-xs ${C.muted}`}>Sem cliente selecionado</p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => (cliente ? setPedidoAberto(true) : setEscolhendoCliente(true))}
                  className={`${C.btnPrimary} shrink-0`}
                >
                  <Icone.sacola className="h-5 w-5" />
                  {cliente ? `Ver pedido${qtdItens ? ` (${qtdItens})` : ""}` : "Selecionar cliente"}
                </button>
              </div>
            </div>
          )}

          {peca && <ModalPeca produto={peca} semCliente={!cliente} onFechar={() => setPeca(null)} onAdicionar={adicionar} />}
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

          {escolhendoCliente && (
            <ModalEscolherCliente
              pendente={pendente}
              clientes={clientes}
              historico={historico}
              onSelecionar={vincularClienteDoModal}
              onCadastrar={cadastrarClienteDoModal}
              onFechar={cancelarEscolhaCliente}
            />
          )}

          {confirmandoTroca && cliente && (
            <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setConfirmandoTroca(false)}>
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="mz-troca-titulo"
                className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom,0px))] shadow-2xl sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="mz-troca-titulo" className="text-lg font-bold">Trocar de cliente?</h2>
                <p className={`mt-2 text-sm ${C.muted}`}>
                  O pedido de <strong className="text-[color:var(--mz-ink)]">{cliente.nome}</strong> possui {itens.length} {itens.length === 1 ? "item" : "itens"} em aberto. Ele fica guardado e volta quando você selecionar este cliente novamente.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setConfirmandoTroca(false)} className={C.btnGhost}>
                    Cancelar
                  </button>
                  <button type="button" onClick={() => trocarCliente(true)} className={C.btnPrimary}>
                    Trocar
                  </button>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div role="status" className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+4rem)] z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl bg-[color:var(--mz-ink)] px-4 py-3 text-sm font-semibold text-white shadow-2xl">
              {toast}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------- fotos originais das peças (sem tratamento) ----------------------------- */

const FOTOS = {
  ef661: { w: 241, h: 108, src: "data:image/webp;base64,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" },
  ef1170: { w: 367, h: 160, src: "data:image/webp;base64,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" },
  ps1030: { w: 370, h: 176, fundo: "#DCDCDC", src: "data:image/webp;base64,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" },
  ps1027: { w: 707, h: 326, fundo: "#DCDCDC", src: "data:image/webp;base64,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" },
  ps057: { w: 315, h: 188, fundo: "#C2BBB1", src: "data:image/webp;base64,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" },
  ef1143: { w: 492, h: 167, fundo: "#C2BBB1", src: "data:image/webp;base64,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" },
  ef1150: { w: 245, h: 192, fundo: "#5F5F5F", src: "data:image/webp;base64,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" },
};

// Logo oficial da Metaliza (fundo azul #203F6E com o monograma prateado)
const LOGO_METALIZA = "data:image/webp;base64,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";
