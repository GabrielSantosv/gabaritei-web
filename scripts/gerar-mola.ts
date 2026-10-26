/**
 * Gera `--ease-spring` (docs/FRONTEND_PARIDADE.md, seção 4.4): pontos de um
 * oscilador harmônico amortecido, amostrados numa função CSS `linear()`. Não
 * escreva a curva à mão — rode este script e commite o resultado em tokens.css.
 *
 * Uso: npx tsx scripts/gerar-mola.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RIGIDEZ = 170; // k: N/m
const AMORTECIMENTO = 18; // c: N·s/m
const MASSA = 1; // m: kg

const AMOSTRAS = 32; // pontos da função linear() — mais pontos, curva mais fiel
const LIMITE_ASSENTAMENTO = 0.001; // envelope < 0,1% de 1 conta como assentado

const CAMINHO_TOKENS = join(__dirname, "..", "src", "styles", "tokens.css");
const MARCADOR_INICIO = "/* gerar-mola:inicio */";
const MARCADOR_FIM = "/* gerar-mola:fim */";

/** Posição normalizada (0 em t=0, tende a 1) do oscilador amortecido (sub-amortecido
 *  quando c² < 4km, que é o nosso caso: gera o "exagero" característico de mola). */
function posicao(t: number, k: number, c: number, m: number): number {
  const omegaN = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  if (zeta >= 1) {
    // Super-amortecido: não deveria acontecer com os parâmetros do grupo, mas não
    // falha silenciosamente — vira uma aproximação sem oscilação.
    return 1 - Math.exp(-omegaN * t) * (1 + omegaN * t);
  }
  const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omegaN * t) * (Math.cos(omegaD * t) + (zeta * omegaN) / omegaD * Math.sin(omegaD * t));
}

/** Tempo até o ENVELOPE de decaimento (não a posição) ficar pequeno — a posição
 *  cruza 1 várias vezes antes de assentar (é a mola passando pelo destino antes
 *  de parar); usar a posição direto pararia na primeira passagem, cortando o
 *  exagero característico da mola fora da curva gerada. */
function tempoDeAssentamento(k: number, c: number, m: number): number {
  const omegaN = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  if (zeta >= 1) {
    let t = 0;
    const passo = 0.001;
    for (; t < 10; t += passo) {
      if (Math.exp(-omegaN * t) * (1 + omegaN * t) < LIMITE_ASSENTAMENTO) break;
    }
    return t;
  }
  const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
  const amplitudeEnvelope = Math.sqrt(1 + ((zeta * omegaN) / omegaD) ** 2);
  return -Math.log(LIMITE_ASSENTAMENTO / amplitudeEnvelope) / (zeta * omegaN);
}

export function gerarPontosMola(k = RIGIDEZ, c = AMORTECIMENTO, m = MASSA, amostras = AMOSTRAS): number[] {
  const assentamento = tempoDeAssentamento(k, c, m);
  const pontos: number[] = [];
  for (let i = 0; i <= amostras; i++) {
    const t = (i / amostras) * assentamento;
    pontos.push(i === amostras ? 1 : posicao(t, k, c, m));
  }
  return pontos;
}

export function gerarLinear(pontos: number[]): string {
  return `linear(${pontos.map((p) => p.toFixed(4)).join(", ")})`;
}

function main() {
  const pontos = gerarPontosMola();
  const linear = gerarLinear(pontos);
  const linha = `  --ease-spring: ${linear}; /* rigidez ${RIGIDEZ}, amortecimento ${AMORTECIMENTO}, massa ${MASSA} — scripts/gerar-mola.ts */`;

  const atual = readFileSync(CAMINHO_TOKENS, "utf-8");
  const inicio = atual.indexOf(MARCADOR_INICIO);
  const fim = atual.indexOf(MARCADOR_FIM);
  if (inicio === -1 || fim === -1 || fim < inicio) {
    console.error(`gerar:mola: não achei os marcadores ${MARCADOR_INICIO} / ${MARCADOR_FIM} em tokens.css.`);
    process.exitCode = 1;
    return;
  }

  const novo = `${atual.slice(0, inicio)}${MARCADOR_INICIO}\n${linha}\n  ${atual.slice(fim)}`;
  writeFileSync(CAMINHO_TOKENS, novo);
  console.log(`gerar:mola: --ease-spring escrito em tokens.css (${pontos.length} pontos).`);
}

if (require.main === module) main();
