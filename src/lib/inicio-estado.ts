import type { Area, AtividadeEmAndamento, Criterio } from "@/lib/api/types";

/**
 * Qual dos estados da tabela (docs/FRONTEND_INICIO.md, "Estados dos cartões")
 * cada cartão de "Seu próximo passo" mostra. Funções puras — a lógica de
 * negócio é só a ordem de precedência entre os estados; nenhuma chama a API.
 */

export type EstadoCartaoAtividade =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "em-andamento"; atividade: AtividadeEmAndamento; rota: string }
  | { tipo: "nada-em-andamento" }
  | { tipo: "conta-nova" };

export function estadoCartaoAtividade(params: {
  carregando: boolean;
  erro: boolean;
  atividade: AtividadeEmAndamento | undefined;
  rotaAtividade: string | null;
  respondidas: number | undefined;
}): EstadoCartaoAtividade {
  if (params.carregando) return { tipo: "carregando" };
  if (params.erro) return { tipo: "erro" };
  if (params.atividade && params.rotaAtividade) {
    return { tipo: "em-andamento", atividade: params.atividade, rota: params.rotaAtividade };
  }
  if (params.respondidas === 0) return { tipo: "conta-nova" };
  return { tipo: "nada-em-andamento" };
}

export type EstadoCartaoProximo =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "dados-insuficientes"; atual: number; minimo: number }
  // Prévia sem commit: o contrato de hoje não tem (PedidoRecomendacao.modo não
  // inclui "auto", Reforco não carrega modelo/criterio) — ver CONTRATO_PARIDADE.md.
  // A função já sabe escolher esse estado pra quando o dado existir.
  | { tipo: "previa-modelo"; criterio: Criterio; area: Area; versaoModelo: string }
  | { tipo: "escolha-automatica" };

export function estadoCartaoProximo(params: {
  carregando: boolean;
  erro: boolean;
  statusReforco: "ok" | "dados_insuficientes" | undefined;
  respostasAtuais: number | undefined;
  respostasMinimas: number | undefined;
  previa?: { criterio: Criterio; area: Area; versaoModelo: string } | null;
}): EstadoCartaoProximo {
  if (params.carregando) return { tipo: "carregando" };
  if (params.erro) return { tipo: "erro" };
  if (params.statusReforco === "dados_insuficientes") {
    return { tipo: "dados-insuficientes", atual: params.respostasAtuais ?? 0, minimo: params.respostasMinimas ?? 0 };
  }
  if (params.previa) {
    return {
      tipo: "previa-modelo",
      criterio: params.previa.criterio,
      area: params.previa.area,
      versaoModelo: params.previa.versaoModelo,
    };
  }
  return { tipo: "escolha-automatica" };
}
