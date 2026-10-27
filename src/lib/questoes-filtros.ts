import type { Area, Faixa, FiltrosQuestoes, QuestaoResumo } from "@/lib/api/types";

export type OrdenarPor = "ano_desc" | "ano_asc" | "faixa_asc" | "faixa_desc";

export interface EstadoFiltros {
  areas: Area[];
  habilidades: string[];
  anos: number[];
  faixas: Faixa[];
  pagina: number;
  ordenar: OrdenarPor;
}

// Reduzido de 20 pra 6 (pedido do usuário): lista mais curta por página,
// menos "parede de texto" assustando quem acabou de abrir a tela.
export const PAGINA_TAMANHO = 6;

/**
 * Tira o sufixo "(LC)" etc. que o mock grava no fim da descrição da
 * habilidade só para permitir o agrupamento por área na Combobox (ver
 * PainelFiltros em questoes-client.tsx) — não deve aparecer pro estudante.
 * TODO(equipe): some sozinho quando o contrato ganhar Habilidade.area de verdade.
 */
export function limparDescricaoHabilidadeMock(descricao: string | null): string | null {
  return descricao?.replace(/\s*\([A-Z]{2}\)\s*$/, "") ?? null;
}

export const FILTROS_PADRAO: EstadoFiltros = {
  areas: [],
  habilidades: [],
  anos: [],
  faixas: [],
  pagina: 1,
  ordenar: "ano_desc",
};

const AREAS_VALIDAS: Area[] = ["LC", "CH", "CN", "MT"];
const FAIXAS_VALIDAS: Faixa[] = ["facil", "media", "dificil"];
const ORDENAR_VALIDOS: OrdenarPor[] = ["ano_desc", "ano_asc", "faixa_asc", "faixa_desc"];

function listaDaUrl<T extends string>(params: URLSearchParams, chave: string, validos: T[]): T[] {
  const valor = params.get(chave);
  if (!valor) return [];
  return valor
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is T => (validos as string[]).includes(v));
}

export function lerFiltrosDaUrl(params: URLSearchParams): EstadoFiltros {
  const anos = (params.get("anos") ?? "")
    .split(",")
    .map((a) => parseInt(a.trim(), 10))
    .filter((a) => !Number.isNaN(a));
  const pagina = parseInt(params.get("pagina") ?? "1", 10);
  const ordenar = params.get("ordenar");

  return {
    areas: listaDaUrl(params, "areas", AREAS_VALIDAS),
    habilidades: (params.get("habilidades") ?? "").split(",").map((h) => h.trim()).filter(Boolean),
    anos,
    faixas: listaDaUrl(params, "faixas", FAIXAS_VALIDAS),
    pagina: Number.isNaN(pagina) || pagina < 1 ? 1 : pagina,
    ordenar: ORDENAR_VALIDOS.includes(ordenar as OrdenarPor) ? (ordenar as OrdenarPor) : "ano_desc",
  };
}

export function filtrosParaQueryString(estado: EstadoFiltros): string {
  const params = new URLSearchParams();
  if (estado.areas.length) params.set("areas", estado.areas.join(","));
  if (estado.habilidades.length) params.set("habilidades", estado.habilidades.join(","));
  if (estado.anos.length) params.set("anos", estado.anos.join(","));
  if (estado.faixas.length) params.set("faixas", estado.faixas.join(","));
  if (estado.pagina > 1) params.set("pagina", String(estado.pagina));
  if (estado.ordenar !== "ano_desc") params.set("ordenar", estado.ordenar);
  return params.toString();
}

export function paraFiltrosApi(estado: EstadoFiltros): FiltrosQuestoes {
  return {
    areas: estado.areas.length ? estado.areas : undefined,
    habilidades: estado.habilidades.length ? estado.habilidades : undefined,
    anos: estado.anos.length ? estado.anos : undefined,
    faixas: estado.faixas.length ? estado.faixas : undefined,
  };
}

/**
 * O intervalo de anos (De/Até) conta como um filtro só, não um por ano — e o
 * mesmo vale pra habilidades: a Combobox de Questões agora escolhe um assunto
 * inteiro de uma vez (ver PainelFiltros em questoes-client.tsx), nunca um
 * código isolado, então os códigos resultantes contam como 1 filtro.
 */
export function contarFiltrosAtivos(estado: EstadoFiltros): number {
  return (
    estado.areas.length +
    (estado.habilidades.length > 0 ? 1 : 0) +
    (estado.anos.length > 0 ? 1 : 0) +
    estado.faixas.length
  );
}

const ORDEM_FAIXA: Record<Faixa, number> = { facil: 0, media: 1, dificil: 2 };

/**
 * Ordena a página atual de resultados (seção 10.3, tela 7). Como a ordenação
 * não é um parâmetro do contrato (seção 7.2), ordenamos só os itens já
 * paginados — não o banco inteiro antes de paginar.
 */
export function ordenarQuestoes(itens: QuestaoResumo[], ordenar: OrdenarPor): QuestaoResumo[] {
  const copia = [...itens];
  switch (ordenar) {
    case "ano_asc":
      return copia.sort((a, b) => (a.ano ?? 0) - (b.ano ?? 0));
    case "ano_desc":
      return copia.sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0));
    case "faixa_asc":
      return copia.sort((a, b) => (a.faixa ? ORDEM_FAIXA[a.faixa] : -1) - (b.faixa ? ORDEM_FAIXA[b.faixa] : -1));
    case "faixa_desc":
      return copia.sort((a, b) => (b.faixa ? ORDEM_FAIXA[b.faixa] : -1) - (a.faixa ? ORDEM_FAIXA[a.faixa] : -1));
    default:
      return copia;
  }
}
