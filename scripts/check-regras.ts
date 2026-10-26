/**
 * Varredura automatizada das regras 4 a 9 (docs/FRONTEND_PROMPT.md, seção 2) em todo
 * `src/`. Versão programática da varredura manual feita na paridade (ver
 * docs/PENDENCIAS.md) — mesmas checagens, repetíveis a cada etapa.
 *
 * Checagens cobertas (etapa de arrumação, item 3):
 *   1.  travessão "—" como separador em texto visível
 *   2.  traço médio "–" (en dash) como separador em texto visível
 *   3.  ponto médio "·" como separador em texto visível
 *   4.  seta (→ ⇒ ➜ ➔ ⟶) como separador em texto visível
 *   5.  `outline: none` / `outline-none` fora da exceção documentada e escopada
 *   6.  `transition: all` / `transition-all` (só transform/opacity, seção 2 regra 10)
 *   7.  `backdrop-filter` / `backdrop-blur-*` / `blur-*` (gradiente/vidro, regra 4)
 *   8.  `gradient` (regra 4)
 *   9.  `uppercase` como estilo de rótulo (regra 6)
 *   10. `tracking-*` (incluindo valor arbitrário `tracking-[...]`) (regra 6)
 *   11. `letter-spacing` literal em CSS (regra 6)
 *   12. matiz entre 250° e 320° (roxo/violeta) em qualquer cor hexadecimal literal,
 *       mesmo sem a palavra "purple"/"roxo" (regra 4) — calculado de verdade, não só grep
 *   13. nome literal de cor (`purple`, `violet`, `roxo`, `lilás`) (regra 4)
 *   14. âmbar (`--amber`/`amber-*`) fora da lista de arquivos permitidos (regra 9)
 *   15. cor literal (hex `#RGB`/`#RRGGBB`/`#RRGGBBAA`, `rgb()`, `rgba()`, `hsl()`,
 *       `hsla()`) fora de `styles/tokens.css` e `styles/globals.css` — "nunca cor
 *       literal no código, sempre o token" (seção 6)
 *   16. gamificação fora de escopo: nota ENEM estimada, conquista, medalha, XP
 *
 * O que o script NÃO consegue verificar (revisão humana continua valendo):
 *   - se um "—"/"–"/"·" isolado é separador ou só um placeholder de valor ausente
 *     (ver `check-regras: ignore`, abaixo) — julgamento de leitura, não sintaxe;
 *   - se uma cor literal fora da faixa 250–320° é mesmo inofensiva ou devia ser token;
 *   - qualquer coisa que dependa de renderizar a tela de verdade (ver
 *     scripts/auditar-contraste.ts e a suíte @a11y pra isso).
 *
 * Uso: npx tsx scripts/check-regras.ts
 * Não depende do servidor de dev rodando (varredura estática de arquivos).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ_SRC = join(__dirname, "..", "src");

interface Falha {
  arquivo: string;
  linha: number;
  trecho: string;
  regra: string;
}

function listarArquivos(dir: string, extensoes: string[]): string[] {
  const resultado: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) {
      resultado.push(...listarArquivos(caminho, extensoes));
    } else if (extensoes.some((ext) => nome.endsWith(ext))) {
      resultado.push(caminho);
    }
  }
  return resultado;
}

/**
 * Marca cada linha como "dentro de comentário de bloco" (`/* ... *\/`, com ou sem o
 * `{` do JSX na frente) rastreando o estado entre linhas — uma heurística de uma
 * linha só não pega uma linha de continuação de um comentário de várias linhas.
 */
function linhasDeComentario(linhas: string[]): boolean[] {
  const marcado: boolean[] = [];
  let dentro = false;
  for (const linha of linhas) {
    const comecouDentro = dentro;
    let resto = linha;
    let tocouComentario = comecouDentro;
    for (;;) {
      if (dentro) {
        const fim = resto.indexOf("*/");
        if (fim === -1) break;
        resto = resto.slice(fim + 2);
        dentro = false;
      } else {
        const inicio = resto.indexOf("/*");
        const linhaUnica = resto.trimStart().startsWith("//");
        if (linhaUnica) {
          tocouComentario = true;
          break;
        }
        if (inicio === -1) break;
        resto = resto.slice(inicio + 2);
        dentro = true;
        tocouComentario = true;
      }
    }
    marcado.push(tocouComentario || comecouDentro);
  }
  return marcado;
}

const ARQUIVOS_TODOS = listarArquivos(RAIZ_SRC, [".ts", ".tsx", ".css"]);
const ARQUIVOS_TSX = ARQUIVOS_TODOS.filter((a) => a.endsWith(".tsx"));

const falhas: Falha[] = [];

function varrer(arquivos: string[], padrao: RegExp, regra: string, pularComentarios = false) {
  for (const arquivo of arquivos) {
    const linhas = readFileSync(arquivo, "utf-8").split("\n");
    const comentario = pularComentarios ? linhasDeComentario(linhas) : null;
    linhas.forEach((linha, i) => {
      if (comentario?.[i]) return;
      // Marcador tipo eslint-disable-next-line: comentário na linha anterior ou na
      // própria linha, pra casos revisados e aceitos conscientemente (ver PENDENCIAS.md).
      if (linha.includes("check-regras: ignore")) return;
      if (i > 0 && linhas[i - 1].includes("check-regras: ignore")) return;
      if (padrao.test(linha)) {
        falhas.push({ arquivo: relative(RAIZ_SRC, arquivo), linha: i + 1, trecho: linha.trim().slice(0, 120), regra });
      }
      padrao.lastIndex = 0; // padrão tem /g em algum caso: zera entre linhas
    });
  }
}

// 1-3: travessão, traço médio e ponto médio como separador em qualquer texto de
// interface. Heurística: só .tsx, pulando linhas de comentário (não é 100% preciso
// — um "—" isolado de placeholder de valor ausente é uma leitura, não uma certeza
// sintática).
varrer(ARQUIVOS_TSX, /—|–|·/, "sem travessão/traço médio/ponto médio como separador (regra 6)", true);

// 4: seta, mas só em link ou botão (seção 7 restringe à diferença de 1-3 acima, que
// valem em qualquer texto). Heurística de linha: a seta e um marcador de link/botão
// na mesma linha — não pega um "→" solto numa legenda ou texto descritivo, que a
// seção 7 não proíbe.
varrer(
  ARQUIVOS_TSX,
  /(→|⇒|➜|➔|⟶).*(<Link|<Button|role="button"|onClick)|(<Link|<Button|role="button"|onClick).*(→|⇒|➜|➔|⟶)/,
  "sem seta em link ou botão (regra 6)",
  true,
);

// 5: outline: none fora da exceção documentada (h1[tabindex="-1"]:focus-visible, em
// globals.css, já marcada com `check-regras: ignore` ali mesmo).
varrer(ARQUIVOS_TODOS, /outline:\s*none|outline-none\b/, "outline: none sem substituto (regra 13)", true);

// 6: só transform/opacity anima (seção 2, regra 10) — nunca transition: all.
varrer(
  ARQUIVOS_TODOS,
  /transition:\s*all\b|transition-property:\s*all\b|\btransition-all\b/,
  "nada de transition: all, só transform/opacity (regra 10)",
  true,
);

// 7-8: vidro/desfoque e gradiente (regra 4).
varrer(ARQUIVOS_TODOS, /backdrop-filter|backdrop(-|\s)?blur|(?<!motion-safe-)\bblur-/i, "sem vidro/desfoque (regra 4)");
varrer(ARQUIVOS_TODOS, /\bgradient\b/i, "sem gradiente (regra 4)");

// 9-11: caixa alta com tracking como estilo de rótulo, e letter-spacing literal.
varrer(ARQUIVOS_TODOS, /\buppercase\b/, "sem caixa alta com tracking (regra 6)");
varrer(ARQUIVOS_TODOS, /\btracking-(wide|wider|widest|\[)/, "sem caixa alta com tracking (regra 6)");
varrer(ARQUIVOS_TODOS, /letter-spacing\s*:/, "sem letter-spacing literal (regra 6)");

// 13: nome literal de cor proibida (roxo/violeta).
varrer(ARQUIVOS_TODOS, /\bpurple\b|\bviolet\b|\broxo\b|\blilás\b|\blilas\b/i, "sem roxo/violeta (regra 4)");

// 16: gamificação fora de escopo. Desde a paridade (P3), "conquista"/"medalha" são
// legítimas atrás de NEXT_PUBLIC_CONQUISTAS — não forbidimos mais a palavra, só o que
// a seção 2 da paridade continua proibindo sempre: nota ENEM estimada, XP, moeda,
// ranking, e cor de metal (ouro/prata/bronze) nas medalhas.
varrer(
  ARQUIVOS_TODOS,
  /nota\s+enem|\bXP\b|\bachievement\b|\branking\b|\bmoeda\b|\bouro\b|\bprata\b|\bbronze\b/i,
  "sem gamificação fora de escopo (seção 2 da paridade)",
);

// 14: âmbar exclusivo de conteúdo de IA. Lista em scripts/permite-ambar.txt
// (docs/FRONTEND_PARIDADE.md, seção 7) — um caminho relativo a src/ por linha.
const ARQUIVOS_AMBER_PERMITIDOS = new Set(
  readFileSync(join(__dirname, "permite-ambar.txt"), "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#")),
);
for (const arquivo of ARQUIVOS_TODOS) {
  const relativo = relative(RAIZ_SRC, arquivo).replace(/\\/g, "/");
  if (ARQUIVOS_AMBER_PERMITIDOS.has(relativo)) continue;
  const linhas = readFileSync(arquivo, "utf-8").split("\n");
  linhas.forEach((linha, i) => {
    if (linha.includes("check-regras: ignore")) return;
    if (i > 0 && linhas[i - 1].includes("check-regras: ignore")) return;
    if (/amber/i.test(linha)) {
      falhas.push({ arquivo: relativo, linha: i + 1, trecho: linha.trim().slice(0, 120), regra: "âmbar exclusivo de IA (regra 9)" });
    }
  });
}

// 17: --accent nunca em StatusChip, Alternativa, ComboMeter, ProgressToMinimum ou
// componente de barra de acerto (seção 4.3: essas peças usam --brand/--ink/--err,
// nenhuma informação pode depender só do acento). Lista de arquivos fechada +
// padrão de nome pra barras de acerto que ainda não existem (P4).
const ARQUIVOS_SEM_ACCENT = new Set([
  "components/dominio/status-chip.tsx",
  "components/dominio/alternativas-radio.tsx",
  "components/dominio/combo-meter.tsx",
  "components/ui/progress-to-minimum.tsx",
]);
for (const arquivo of ARQUIVOS_TODOS) {
  const relativo = relative(RAIZ_SRC, arquivo).replace(/\\/g, "/");
  if (!ARQUIVOS_SEM_ACCENT.has(relativo) && !/barra.?acerto|taxa.?acerto/i.test(relativo)) continue;
  const linhas = readFileSync(arquivo, "utf-8").split("\n");
  linhas.forEach((linha, i) => {
    if (linha.includes("check-regras: ignore")) return;
    if (i > 0 && linhas[i - 1].includes("check-regras: ignore")) return;
    if (/accent/i.test(linha)) {
      falhas.push({ arquivo: relativo, linha: i + 1, trecho: linha.trim().slice(0, 120), regra: "--accent fora de uso permitido (seção 4.3)" });
    }
  });
}

// 12 e 15: cor literal fora dos tokens, e dentro dela, matiz de roxo/violeta (250–320°)
// mesmo sem a palavra. Só styles/tokens.css e styles/globals.css podem ter cor literal
// (é onde os tokens são definidos) — todo o resto deve usar o token, nunca o valor cru.
const ARQUIVOS_TOKEN = new Set([
  "styles/tokens.css",
  "styles/globals.css",
  "styles/paletas.generated.css",
]);

function hexParaHue(hex: string): number | null {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0; // cinza: sem matiz
  const d = max - min;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

const PADRAO_HEX = /#[0-9a-fA-F]{3,8}\b/g;
const PADRAO_RGB_HSL = /\b(rgba?|hsla?)\(/;

for (const arquivo of ARQUIVOS_TODOS) {
  const relativo = relative(RAIZ_SRC, arquivo).replace(/\\/g, "/");
  if (ARQUIVOS_TOKEN.has(relativo)) continue;
  const linhas = readFileSync(arquivo, "utf-8").split("\n");
  const comentario = linhasDeComentario(linhas);
  linhas.forEach((linha, i) => {
    if (comentario[i]) return;
    if (linha.includes("check-regras: ignore")) return;
    if (i > 0 && linhas[i - 1].includes("check-regras: ignore")) return;

    const hexes = linha.match(PADRAO_HEX);
    if (hexes) {
      for (const hex of hexes) {
        const hue = hexParaHue(hex);
        falhas.push({
          arquivo: relativo,
          linha: i + 1,
          trecho: linha.trim().slice(0, 120),
          regra: "cor literal fora dos tokens (seção 6)",
        });
        if (hue !== null && hue >= 250 && hue <= 320) {
          falhas.push({
            arquivo: relativo,
            linha: i + 1,
            trecho: `${hex} → matiz ${Math.round(hue)}°`,
            regra: "matiz roxo/violeta 250-320° (regra 4)",
          });
        }
      }
    }
    if (PADRAO_RGB_HSL.test(linha)) {
      falhas.push({
        arquivo: relativo,
        linha: i + 1,
        trecho: linha.trim().slice(0, 120),
        regra: "cor literal fora dos tokens (seção 6)",
      });
    }
    PADRAO_RGB_HSL.lastIndex = 0;
  });
}

if (falhas.length === 0) {
  console.log("check:regras: zero falhas.");
} else {
  console.log(`check:regras: ${falhas.length} falha(s):\n`);
  for (const f of falhas) {
    console.log(`  [${f.regra}] src/${f.arquivo}:${f.linha}\n    ${f.trecho}`);
  }
  process.exitCode = 1;
}
