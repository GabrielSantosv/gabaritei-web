import type {
  AbaHistorico,
  AtividadeEmAndamento,
  Correcao,
  EnvioResposta,
  EnvioResultado,
  FiltrosHistorico,
  FiltrosQuestoes,
  Habilidade,
  ItemHistorico,
  Marcacao,
  Pagina,
  ParamsSessao,
  ParamsSessaoAuto,
  PedidoRecomendacao,
  Perfil,
  Preferencias,
  Proficiencia,
  Questao,
  QuestaoResumo,
  RecomendacaoResposta,
  Reforco,
  Regularidade,
  ResultadoSimulado,
  ResumoGeral,
  ResumoSessao,
  Sessao,
  Simulado,
  SimuladoConfig,
  SimuladoResumo,
  Tentativa,
} from "./types";
import { httpApi } from "./http/client";
import { mockApi } from "./mock/client";

/**
 * Interface Api (docs/FRONTEND_PROMPT.md, seção 7.2). As telas só conversam com isto.
 * Troca de mock para http não pode exigir mudança em nenhuma tela ou componente.
 */
export interface Api {
  // Autenticação (Supabase Auth — TODO(equipe): confirmar provedor)
  entrar(input: { email: string; senha: string }): Promise<Perfil>;
  cadastrar(input: {
    nome: string;
    email: string;
    senha: string;
    faixaEtaria: "maior_18" | "menor_18";
  }): Promise<Perfil>;
  sair(): Promise<void>;
  obterUsuarioAtual(): Promise<Perfil | null>;

  // Perfil e preferências
  obterPerfil(): Promise<Perfil>;
  atualizarPerfil(input: Partial<Pick<Perfil, "nome" | "apelido" | "onboardingConcluido">>): Promise<Perfil>;
  obterPreferencias(): Promise<Preferencias>;
  atualizarPreferencias(input: Partial<Preferencias>): Promise<Preferencias>;
  listarAtividadesEmAndamento(): Promise<AtividadeEmAndamento[]>;

  // Banco de questões
  listarQuestoes(
    filtros: FiltrosQuestoes,
    pagina: { pagina: number; porPagina: number },
  ): Promise<Pagina<QuestaoResumo>>;
  obterQuestao(id: string): Promise<Questao>;
  listarHabilidades(): Promise<Habilidade[]>;

  // Recomendação
  obterRecomendacoes(pedido: PedidoRecomendacao): Promise<RecomendacaoResposta>;

  // Sessão de treino
  iniciarSessao(
    params: ParamsSessao | ParamsSessaoAuto,
  ): Promise<{ sessao: Sessao; primeira: RecomendacaoResposta }>;
  obterSessao(id: string): Promise<Sessao>;
  encerrarSessao(id: string): Promise<ResumoSessao>;
  obterResumoSessao(id: string): Promise<ResumoSessao>;

  // Tentativas
  enviarResposta(envio: EnvioResposta): Promise<EnvioResultado>;
  obterTentativa(id: string): Promise<Tentativa>;

  // Histórico (canvas Telas.dc.html, bloco isHistorico)
  listarHistorico(
    aba: AbaHistorico,
    filtros: FiltrosHistorico,
    pagina: { pagina: number; porPagina: number },
  ): Promise<Pagina<ItemHistorico>>;
  definirMarcacao(questaoId: string, input: Partial<Pick<Marcacao, "favorita" | "paraRevisar">>): Promise<Marcacao>;

  // Progresso
  obterProficiencias(): Promise<Proficiencia[]>;
  obterReforco(): Promise<Reforco>;
  obterRegularidade(): Promise<Regularidade>;
  obterResumoGeral(): Promise<ResumoGeral>;

  // Simulado
  listarSimulados(): Promise<SimuladoResumo[]>;
  criarSimulado(config: SimuladoConfig): Promise<Simulado>;
  obterSimulado(id: string): Promise<Simulado>;
  salvarRespostaSimulado(id: string, n: number, letra: Correcao["gabarito"] | null): Promise<void>;
  marcarRevisao(id: string, n: number, marcada: boolean): Promise<void>;
  finalizarSimulado(id: string): Promise<ResultadoSimulado>;
  obterResultadoSimulado(id: string): Promise<ResultadoSimulado>;
}

export type ApiMode = "mock" | "http";

function lerModo(): ApiMode {
  const modo = process.env.NEXT_PUBLIC_API_MODE;
  return modo === "http" ? "http" : "mock";
}

export function apiMode(): ApiMode {
  return lerModo();
}

/**
 * Ponto único de acesso à API. As telas (via hooks em `lib/hooks`) só chamam
 * `getApi()`, nunca importam mock/http direto — por isso a escolha mock|http
 * fica isolada aqui. `mockApi` roda no navegador e usa localStorage, então
 * `getApi()` só deve ser chamado a partir de Client Components.
 */
export function getApi(): Api {
  return lerModo() === "http" ? httpApi : mockApi;
}
