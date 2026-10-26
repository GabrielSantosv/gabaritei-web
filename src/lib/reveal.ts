import type { CSSProperties } from "react";

/**
 * Cascata de blocos de topo na entrada da rota (docs/FRONTEND_PARIDADE.md, 4.4):
 * `<div {...revelar(0)}>`, `{...revelar(1)}`... — `--i` vira o índice do bloco,
 * a animação e o limite de 5 ficam em globals.css (`[data-reveal]`).
 */
export function revelar(i: number): { "data-reveal": true; style: CSSProperties } {
  return { "data-reveal": true, style: { "--i": i } as CSSProperties };
}
