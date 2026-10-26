/**
 * Audita as 5 paletas (docs/FRONTEND_PARIDADE.md, seção 4.2): os pares de contraste
 * da tabela, e que `paletas.generated.css` não ficou fora de sincronia com
 * `paletas.json` (gera de novo em memória e compara byte a byte com o arquivo
 * versionado — ver ajuste 5 do plano da P1).
 *
 * Não depende de navegador: os valores vêm direto do JSON, contraste calculado em
 * JS puro (mesma fórmula WCAG do auditar-contraste.ts).
 *
 * Uso: npx tsx scripts/auditar-paletas.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gerarCss } from "./gerar-paletas";

const CAMINHO_JSON = join(__dirname, "..", "src", "styles", "paletas.json");
const CAMINHO_CSS = join(__dirname, "..", "src", "styles", "paletas.generated.css");

type Tokens = Record<string, string>;
interface Paleta {
  light: Tokens;
  dark: Tokens;
}

// Fixos: não mudam em nenhuma paleta (seção 4.2).
const AMBER_INK = "#6B4A10";
const AMBER_SOFT = "#F3E7CC";
const AMBER_INK_DARK = "#E5B85A";
const AMBER_SOFT_DARK = "#323324";
const ERR = "#A8321F";
const ERR_DARK = "#EE8F7F";

function hexParaRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function razao(a: string, b: string): number {
  const l1 = luminancia(hexParaRgb(a)) + 0.05;
  const l2 = luminancia(hexParaRgb(b)) + 0.05;
  return Math.round((l1 > l2 ? l1 / l2 : l2 / l1) * 100) / 100;
}

interface Falha {
  paleta: string;
  tema: string;
  par: string;
  razao: number;
  minimo: number;
}

function checar(falhas: Falha[], paleta: string, tema: string, par: string, fg: string, bg: string, minimo: number) {
  const r = razao(fg, bg);
  if (r < minimo) falhas.push({ paleta, tema, par, razao: r, minimo });
}

function auditarPaleta(falhas: Falha[], id: string, tema: "light" | "dark", t: Tokens) {
  const nomeTema = tema === "light" ? "claro" : "escuro";
  const amberInk = tema === "light" ? AMBER_INK : AMBER_INK_DARK;
  const amberSoft = tema === "light" ? AMBER_SOFT : AMBER_SOFT_DARK;
  const err = tema === "light" ? ERR : ERR_DARK;

  checar(falhas, id, nomeTema, "--ink sobre --paper", t.ink, t.paper, 4.5);
  checar(falhas, id, nomeTema, "--ink sobre --paper-2", t.ink, t["paper-2"], 4.5);
  checar(falhas, id, nomeTema, "--ink sobre --card", t.ink, t.card, 4.5);
  checar(falhas, id, nomeTema, "--ink-2 sobre --paper", t["ink-2"], t.paper, 4.5);
  checar(falhas, id, nomeTema, "--ink-2 sobre --paper-2", t["ink-2"], t["paper-2"], 4.5);
  checar(falhas, id, nomeTema, "--ink-2 sobre --card", t["ink-2"], t.card, 4.5);

  checar(falhas, id, nomeTema, "--brand-ink sobre --paper", t["brand-ink"], t.paper, 4.5);
  checar(falhas, id, nomeTema, "--brand-ink sobre --card", t["brand-ink"], t.card, 4.5);
  checar(falhas, id, nomeTema, "--brand-ink sobre --brand-soft", t["brand-ink"], t["brand-soft"], 4.5);

  checar(falhas, id, nomeTema, "--on-brand sobre --brand", t["on-brand"], t.brand, 4.5);
  checar(falhas, id, nomeTema, "--on-brand sobre --brand-hover", t["on-brand"], t["brand-hover"], 4.5);

  checar(falhas, id, nomeTema, "--rule-strong sobre --paper", t["rule-strong"], t.paper, 3);
  checar(falhas, id, nomeTema, "--rule-strong sobre --card", t["rule-strong"], t.card, 3);

  checar(falhas, id, nomeTema, "--brand sobre --paper", t.brand, t.paper, 3);
  checar(falhas, id, nomeTema, "--brand sobre --card", t.brand, t.card, 3);
  checar(falhas, id, nomeTema, "--accent sobre --paper", t.accent, t.paper, 3);
  checar(falhas, id, nomeTema, "--accent sobre --card", t.accent, t.card, 3);

  checar(falhas, id, nomeTema, "--accent-ink sobre --accent-soft", t["accent-ink"], t["accent-soft"], 4.5);
  checar(falhas, id, nomeTema, "--accent-ink sobre --paper", t["accent-ink"], t.paper, 4.5);

  checar(falhas, id, nomeTema, "--err sobre --paper", err, t.paper, 4.5);
  checar(falhas, id, nomeTema, "--err sobre --card", err, t.card, 4.5);

  checar(falhas, id, nomeTema, "--amber-ink sobre --amber-soft", amberInk, amberSoft, 4.5);

  // Faixa principal (seção 4.3): claro usa --brand-hover de fundo; escuro usa --brand-soft.
  if (tema === "light") {
    checar(falhas, id, nomeTema, "Faixa: --on-brand sobre --brand-hover", t["on-brand"], t["brand-hover"], 4.5);
    checar(falhas, id, nomeTema, "Faixa: --ink sobre --paper (botão invertido)", t.ink, t.paper, 4.5);
    checar(falhas, id, nomeTema, "Faixa: --paper contra --brand-hover (borda do botão)", t.paper, t["brand-hover"], 3);
  } else {
    checar(falhas, id, nomeTema, "Faixa: --ink sobre --brand-soft", t.ink, t["brand-soft"], 4.5);
    checar(falhas, id, nomeTema, "Faixa: --ink-2 sobre --brand-soft", t["ink-2"], t["brand-soft"], 4.5);
    checar(falhas, id, nomeTema, "Faixa: --on-brand sobre --brand (botão)", t["on-brand"], t.brand, 4.5);
    checar(falhas, id, nomeTema, "Faixa: --brand contra --brand-soft", t.brand, t["brand-soft"], 3);
    checar(falhas, id, nomeTema, "Faixa: --accent-ink sobre --brand-soft", t["accent-ink"], t["brand-soft"], 4.5);
  }
}

function main() {
  const paletas = JSON.parse(readFileSync(CAMINHO_JSON, "utf-8")) as Record<string, Paleta>;
  const falhas: Falha[] = [];

  for (const [id, paleta] of Object.entries(paletas)) {
    auditarPaleta(falhas, id, "light", paleta.light);
    auditarPaleta(falhas, id, "dark", paleta.dark);
  }

  // paletas.generated.css não pode ficar fora de sincronia com paletas.json.
  const cssEsperado = gerarCss(paletas);
  const cssAtual = readFileSync(CAMINHO_CSS, "utf-8");
  const cssDesincronizado = cssEsperado.trim() !== cssAtual.trim();

  if (falhas.length === 0 && !cssDesincronizado) {
    console.log(`audit:paletas: zero falhas (${Object.keys(paletas).length} paletas × 2 temas).`);
    return;
  }

  if (cssDesincronizado) {
    console.log(
      "audit:paletas: paletas.generated.css está DESSINCRONIZADO de paletas.json. Rode `npm run gerar:paletas` e commite o resultado.\n",
    );
    process.exitCode = 1;
  }

  if (falhas.length > 0) {
    console.log(`audit:paletas: ${falhas.length} falha(s) de contraste:\n`);
    for (const f of falhas) {
      console.log(`  [${f.paleta} / ${f.tema}] ${f.par}: ${f.razao}:1 (mínimo ${f.minimo}:1)`);
    }
    process.exitCode = 1;
  }
}

main();
