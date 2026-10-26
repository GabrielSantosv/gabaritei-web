import type { Api } from "../client";
import { ApiError } from "../types";

/**
 * Implementação real (fetch para a FastAPI). Esqueleto da etapa 0: toda
 * função lança ApiError('indisponivel') até o back-end existir.
 * TODO(equipe): implementar cada função contra os endpoints da seção 7.2
 * do docs/FRONTEND_PROMPT.md, lendo NEXT_PUBLIC_API_URL.
 */
function indisponivel(): never {
  throw new ApiError("indisponivel", "A API ainda não está disponível.");
}

export const httpApi: Api = {
  entrar: async () => indisponivel(),
  cadastrar: async () => indisponivel(),
  sair: async () => indisponivel(),
  obterUsuarioAtual: async () => indisponivel(),

  obterPerfil: async () => indisponivel(),
  atualizarPerfil: async () => indisponivel(),
  obterPreferencias: async () => indisponivel(),
  atualizarPreferencias: async () => indisponivel(),
  listarAtividadesEmAndamento: async () => indisponivel(),

  listarQuestoes: async () => indisponivel(),
  obterQuestao: async () => indisponivel(),
  listarHabilidades: async () => indisponivel(),

  obterRecomendacoes: async () => indisponivel(),

  iniciarSessao: async () => indisponivel(),
  obterSessao: async () => indisponivel(),
  encerrarSessao: async () => indisponivel(),
  obterResumoSessao: async () => indisponivel(),

  enviarResposta: async () => indisponivel(),
  obterTentativa: async () => indisponivel(),
  listarHistorico: async () => indisponivel(),
  definirMarcacao: async () => indisponivel(),

  obterProficiencias: async () => indisponivel(),
  obterReforco: async () => indisponivel(),
  obterRegularidade: async () => indisponivel(),
  obterResumoGeral: async () => indisponivel(),

  listarSimulados: async () => indisponivel(),
  criarSimulado: async () => indisponivel(),
  obterSimulado: async () => indisponivel(),
  salvarRespostaSimulado: async () => indisponivel(),
  marcarRevisao: async () => indisponivel(),
  finalizarSimulado: async () => indisponivel(),
  obterResultadoSimulado: async () => indisponivel(),
};
