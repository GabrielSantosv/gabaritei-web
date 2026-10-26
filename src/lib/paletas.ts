/**
 * Paletas (docs/FRONTEND_PARIDADE.md, seção 4.2/4.6). Fonte dos valores:
 * `styles/paletas.json` (o CSS de verdade é `styles/paletas.generated.css`, gerado
 * dele — ver `scripts/gerar-paletas.ts`). Este módulo só cuida de metadado (nome
 * pra UI), validação contra `NEXT_PUBLIC_PALETAS`, e aplicar/atualizar o DOM.
 */
import paletasJson from "@/styles/paletas.json";
import type { PaletaId } from "@/lib/api/types";

export type { PaletaId };

export const NOME_PALETA: Record<PaletaId, string> = {
  floresta: "Floresta",
  oceano: "Oceano",
  terracota: "Terracota",
  brasa: "Brasa",
  sol: "Sol",
};

const TODAS_PALETAS: PaletaId[] = ["floresta", "oceano", "terracota", "brasa", "sol"];
const PADRAO: PaletaId = "floresta";

/** Lê `NEXT_PUBLIC_PALETAS` (lista separada por vírgula) e filtra as válidas. */
export function paletasPermitidas(): PaletaId[] {
  const valor = process.env.NEXT_PUBLIC_PALETAS;
  if (!valor) return [PADRAO];
  const pedidas = valor
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is PaletaId => TODAS_PALETAS.includes(p as PaletaId));
  // Floresta sempre disponível (é o padrão de fallback) mesmo se a env esquecer dela.
  return pedidas.includes(PADRAO) ? pedidas : [PADRAO, ...pedidas];
}

/** Valor salvo que não seja uma paleta conhecida ou não esteja na lista permitida cai em Floresta. */
export function paletaValida(valor: string | null | undefined): PaletaId {
  const permitidas = paletasPermitidas();
  if (valor && TODAS_PALETAS.includes(valor as PaletaId) && permitidas.includes(valor as PaletaId)) {
    return valor as PaletaId;
  }
  return PADRAO;
}

export function aplicarPaleta(paleta: PaletaId): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", paleta);
}

/** Cor de `--paper` da paleta+tema, pro <meta name="theme-color"> (seção 4.2, "Como aplicar"). */
export function corPaperDe(paleta: PaletaId, tema: "light" | "dark"): string {
  const dados = (paletasJson as Record<PaletaId, { light: { paper: string }; dark: { paper: string } }>)[paleta];
  return tema === "light" ? dados.light.paper : dados.dark.paper;
}

export function atualizarThemeColor(paleta: PaletaId, temaEscuro: boolean): void {
  if (typeof document === "undefined") return;
  const cor = corPaperDe(paleta, temaEscuro ? "dark" : "light");
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", cor);
}
