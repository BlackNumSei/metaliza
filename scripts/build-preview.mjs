// Gera preview/index.html (standalone, React UMD + Tailwind CDN) a partir de src/MetalizaApp.jsx.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { transformSync } from "esbuild";

const fonte = readFileSync(new URL("../src/MetalizaApp.jsx", import.meta.url), "utf8")
  .replace(/^import React, \{([^}]*)\} from "react";/m, "const {$1} = React;")
  .replace(/^import \{([^}]*)\} from "lucide-react";/m, "const {$1} = LucideReact;")
  .replace("export default function MetalizaApp", "function MetalizaApp");

const { code } = transformSync(fonte, { loader: "jsx", jsx: "transform", target: "es2019" });

const html = `<title>Metaliza Representante</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>window.react = window.React; /* o UMD do lucide-react procura o global "react" */</script>
<script src="https://cdn.jsdelivr.net/npm/lucide-react@0.263.1/dist/umd/lucide-react.min.js"></script>
<style>html,body{height:100%}body{background:#F5F4F1}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) body{background:#121211}}:root[data-theme="dark"] body{background:#121211}</style>
<div id="root"></div>
<script>
${code}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(MetalizaApp));
</script>
`;

mkdirSync(new URL("../preview/", import.meta.url), { recursive: true });
writeFileSync(new URL("../preview/index.html", import.meta.url), html);
console.log("preview/index.html gerado");
