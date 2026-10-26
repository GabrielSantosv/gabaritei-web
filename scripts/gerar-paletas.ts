/**
 * Gera `src/styles/paletas.generated.css` a partir de `src/styles/paletas.json`
 * (docs/FRONTEND_PARIDADE.md, seção 4.2). Script manual, versionado (como
 * `gerar-mock.ts`) — rode de novo sempre que mudar `paletas.json` e commite o CSS
 * gerado junto. `npm run audit:paletas` falha se os dois ficarem fora de sincronia.
 *
 * A paleta Floresta não entra aqui: ela já é o :root padrão de `tokens.css`
 * ("fica idêntica ao que existe hoje") — nada precisa sobrescrevê-la.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CAMINHO_JSON = join(__dirname, "..", "src", "styles", "paletas.json");
const CAMINHO_SAIDA = join(__dirname, "..", "src", "styles", "paletas.generated.css");

type Tokens = Record<string, string>;
interface Paleta {
  light: Tokens;
  dark: Tokens;
}

const ORDEM_TOKENS = [
  "paper",
  "paper-2",
  "card",
  "ink",
  "ink-2",
  "rule-strong",
  "brand",
  "brand-hover",
  "brand-soft",
  "brand-ink",
  "on-brand",
  "accent",
  "accent-ink",
  "accent-soft",
];

function blocoTokens(tokens: Tokens, indentacao: string): string {
  const linhas = ORDEM_TOKENS.map((chave) => `${indentacao}--${chave}: ${tokens[chave]};`);
  return linhas.join("\n");
}

export function gerarCss(paletas: Record<string, Paleta>): string {
  const partes: string[] = [
    "/*",
    " * GERADO AUTOMATICAMENTE por scripts/gerar-paletas.ts a partir de paletas.json.",
    " * Não edite à mão — mude o JSON e rode `npm run gerar:paletas`.",
    " * docs/FRONTEND_PARIDADE.md, seção 4.2.",
    " */",
    "",
  ];

  for (const [id, paleta] of Object.entries(paletas)) {
    if (id === "floresta") continue; // já é o :root padrão de tokens.css

    partes.push(`/* ${id} */`);
    partes.push(`html[data-palette="${id}"] {`);
    partes.push(blocoTokens(paleta.light, "  "));
    partes.push(`  --rule: color-mix(in srgb, var(--ink) 16%, var(--paper));`);
    partes.push("}");
    partes.push("");
    partes.push(`html[data-palette="${id}"][data-theme="dark"] {`);
    partes.push(blocoTokens(paleta.dark, "  "));
    partes.push(`  --rule: color-mix(in srgb, var(--ink) 14%, var(--paper));`);
    partes.push("}");
    partes.push("");
    partes.push(`@media (prefers-color-scheme: dark) {`);
    partes.push(`  html[data-palette="${id}"]:not([data-theme="light"]) {`);
    partes.push(blocoTokens(paleta.dark, "    "));
    partes.push(`    --rule: color-mix(in srgb, var(--ink) 14%, var(--paper));`);
    partes.push("  }");
    partes.push("}");
    partes.push("");
  }

  return partes.join("\n");
}

function main() {
  const paletas = JSON.parse(readFileSync(CAMINHO_JSON, "utf-8")) as Record<string, Paleta>;
  const css = gerarCss(paletas);
  writeFileSync(CAMINHO_SAIDA, css, "utf-8");
  console.log(`gerar:paletas: escrito em ${CAMINHO_SAIDA}`);
}

if (require.main === module) {
  main();
}
