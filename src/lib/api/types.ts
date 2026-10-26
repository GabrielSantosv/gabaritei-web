/**
 * Contrato da API (docs/FRONTEND_PROMPT.md, seção 7.1).
 * Fonte única dos tipos. Quando a FastAPI existir, isto é regenerado do
 * OpenAPI (openapi-typescript) e as diferenças viram ajustes em docs/PENDENCIAS.md.
 */

export type Area = "LC" | "CH" | "CN" | "MT";
export type Faixa = "facil" | "media" | "dificil";
export type Letra = "A" | "B" | "C" | "D" | "E";
export type ModoPratica =
  | "livre"
  | "tema"
  | "habilidade"
  | "nivel"
  | "progressao"
  | "simulado"; // a Fase 2 acrescenta 'lista' e 'diagnostico'
export type StatusDados = "ok" | "dados_insuficientes";

/** Paridade (docs/FRONTEND_PARIDADE.md, seção 4.2/5): as 5 paletas trocáveis. */
export type PaletaId = "floresta" | "oceano" | "terracota" | "brasa" | "sol";

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Conteúdo da questão (RF05). Figura sem alt/audiodescricao NÃO pode ser escondida nem inventada. */
export interface Figura {
  id: string;
  src: string;
  alt: string | null;
  audiodescricao: string | null;
}

export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "figura"; figura: Figura }
  | { tipo: "citacao"; texto: string; fonte?: string }
  | { tipo: "formula"; latex: string; leitura: string }; // TODO(equipe): só se o dataset trouxer fórmulas

export interface Habilidade {
  codigo: string;
  descricao: string | null;
  // Desempenho (pedido à parte, fora das etapas P*): a habilidade não guardava
  // a própria área nem um agrupamento por assunto — precisava de ambos pra
  // montar a tela de Desempenho (área > assunto > habilidade). Fecha a
  // pendência já documentada em PENDENCIAS.md (decisão 6b).
  area: Area;
  assunto: string;
} // ex.: 'H21'

export interface Questao {
  id: string;
  ano: number | null;
  area: Area;
  coItem: string | null;
  habilidade: Habilidade | null; // null = "não informado"
  faixa: Faixa | null; // null = sem TRI para derivar
  tri: { a: number | null; b: number | null; c: number | null };
  enunciado: Bloco[];
  alternativas: { letra: Letra; conteudo: Bloco[] }[]; // 5 itens
  temResolucao: boolean;
  // gabarito e texto da resolução NÃO vêm aqui: só chegam em Correcao, depois do envio.
}

/** Linha da listagem do banco de questões (RF04) */
export interface QuestaoResumo {
  id: string;
  area: Area;
  ano: number | null;
  habilidade: Habilidade | null;
  faixa: Faixa | null;
  trecho: string; // início do enunciado, texto puro
  ultimaTentativa: "acertou" | "errou" | null; // null = ainda não respondeu
}

export interface FiltrosQuestoes {
  areas?: Area[];
  habilidades?: string[];
  anos?: number[];
  faixas?: Faixa[];
}

/** Recomendação (RF11) */
export interface Criterio {
  modo: "tema" | "habilidade" | "nivel" | "progressao";
  texto: string; // frase pronta da API. Ex.: "Mesma habilidade (H21) em que você acertou 38 %."
  area?: Area;
  habilidade?: string;
  faixaAlvo?: Faixa;
}

export interface Recomendacao {
  id: string;
  posicao: number;
  questao: Questao;
  criterio: Criterio;
}

export interface Aviso {
  tipo: "sem_historico" | "faixa_ampliada" | "reapresentadas" | "poucas_elegiveis";
  texto: string;
}

export interface RecomendacaoResposta {
  itens: Recomendacao[]; // até 5
  // RF08/RNF09: versão que originou a recomendação. null = escolha por regra
  // simples (ex.: sem histórico suficiente para um critério de verdade) — o
  // selo de IA (CriterioRecomendacao, regra 9) só aparece quando isto existe.
  modelo: { nome: string; versao: string } | null;
  aviso: Aviso | null;
}

export interface PedidoRecomendacao {
  modo: "tema" | "habilidade" | "nivel" | "progressao";
  areas?: Area[];
  habilidade?: string;
  // Treinar um assunto inteiro (Desempenho → "Treinar {assunto}, N questões"):
  // qualquer habilidade da lista serve. Convive com `habilidade` (singular);
  // se os dois vierem, `habilidade` ganha.
  habilidades?: string[];
  temaTexto?: string;
  questaoBaseId?: string;
  quantidade?: number; // padrão 5
}

/** Tentativa e correção (RF06, RF07, RF08) */
export interface EnvioResposta {
  questaoId: string;
  letra: Letra;
  modo: ModoPratica;
  sessaoId: string | null;
  recomendacaoId: string | null;
  chaveIdempotencia: string; // impede duplicação acidental (RF06)
}

export interface Correcao {
  tentativaId: string;
  correta: boolean;
  gabarito: Letra;
  resolucao: string | null; // null = "Resolução ainda não cadastrada"
  respondidaEm: string;
}

export interface EnvioResultado {
  correcao: Correcao;
  combo: ComboEstado | null;
  proxima: Recomendacao | null;
}

/** usada na revisão de uma questão já respondida */
export interface Tentativa {
  id: string;
  questaoId: string;
  resposta: Letra | null;
  correcao: Correcao;
  modo: ModoPratica;
  versaoModelo: string | null;
  sessaoId: string | null;
}

/** Sessão de treino e Combo (RF17, RF18). Regra do Combo é da API; a tela só exibe. */
export interface ComboConfig {
  acertosPorDegrau: number;
  noErro: "reinicia" | "reduz";
} // TODO(equipe): valores

export interface ComboEstado {
  atual: number;
  melhor: number;
  degrau: number;
  degrausTotal: number; // posição na escada de dificuldade
  faixaAlvo: Faixa;
  acertosParaSubir: number | null; // null = já no topo
  evento: null | "subiu" | "desceu" | "reiniciou" | "no_topo";
  config: ComboConfig;
}

export interface Sessao {
  id: string;
  modo: ModoPratica;
  iniciadaEm: string;
  encerradaEm: string | null;
  total: number | null;
  respondidas: number;
  acertos: number;
  combo: ComboEstado | null;
  duracaoSegundos: number | null;
}

export interface ParamsSessao extends PedidoRecomendacao {
  quantidade: number;
}

/** "Deixar o modelo escolher" (P2, Início): a API escolhe o modo e devolve o
 *  critério — nunca fica salvo como modo "auto" em Sessao.modo, que continua
 *  sempre um ModoPratica de verdade. */
export interface ParamsSessaoAuto {
  modo: "auto";
}

export interface ResumoSessao {
  sessao: Sessao;
  itens: {
    posicao: number;
    tentativaId: string;
    questaoId: string;
    area: Area;
    habilidade: string | null;
    letra: Letra;
    correta: boolean;
  }[];
  porHabilidade: { habilidade: Habilidade | null; acertos: number; total: number }[];
  foguinho: Regularidade["foguinho"];
  proficiencias: Proficiencia[];
  proxima: Recomendacao | null;
}

/** Progresso e perfil (RF09, RF10, RF17) */
export type Tendencia = "subindo" | "estavel" | "caindo";

export interface Proficiencia {
  area: Area;
  status: StatusDados;
  valor: number | null;
  intervalo: [number, number] | null;
  respostasConsideradas: number;
  respostasMinimas: number;
  rotuloEscala: string; // TODO(equipe): que escala exibir (theta ou 0 a 1000)
  tendencia: Tendencia | null;
  atualizadaEm: string | null;
}

export type PeriodoDesempenho = "7" | "30" | "90" | "tudo";

/**
 * Desempenho por área (pedido à parte, fora das etapas P*): diferente de
 * `Proficiencia` (estimativa do modelo, com intervalo), isto é contagem
 * simples — respondidas/acertos/taxa — só que quebrada por assunto e
 * habilidade dentro da área escolhida.
 */
export interface DesempenhoHabilidade {
  habilidade: Habilidade;
  respondidas: number;
  acertos: number;
  taxaAcerto: number | null;
  // null = respostas de menos pra apontar tendência (regra: mín. de respostas).
  tendencia: Tendencia | null;
}

export interface DesempenhoAssunto {
  nome: string;
  habilidades: DesempenhoHabilidade[];
  respondidas: number;
  acertos: number;
  taxaAcerto: number | null;
  tendencia: Tendencia | null;
  maisFraco: boolean;
}

export interface DesempenhoArea {
  area: Area;
  periodo: PeriodoDesempenho;
  respondidas: number;
  acertos: number;
  taxaAcerto: number | null;
  assuntoMaisFraco: { nome: string; taxaAcerto: number; respondidas: number } | null;
  assuntos: DesempenhoAssunto[];
}

export interface Reforco {
  status: StatusDados;
  respostasAtuais: number;
  respostasMinimas: number;
  prioridades: {
    posicao: number;
    area: Area;
    habilidade: Habilidade;
    taxaAcerto: number;
    respostas: number;
  }[];
}

export interface Regularidade {
  foguinho: { atual: number; melhor: number; hojeContou: boolean; emRisco: boolean };
  semana: { data: string; questoes: number }[]; // 7 dias
  metaSemanal: { alvo: number; feito: number };
}

export interface ResumoGeral {
  respondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number | null;
  simuladosConcluidos: number;
  sessoesConcluidas: number;
  respondidasSemana: number;
  // Taxa de acerto por área (P2, "Seus números") — mesma métrica simples do
  // resumo geral, só quebrada por área; não é proficiência (que é estimativa
  // do modelo, com intervalo e tendência, e fica fora do Início de propósito).
  porArea: { area: Area; respondidas: number; acertos: number; taxaAcerto: number | null }[];
}

/** Até 3 no Início, "Continue de onde parou" (P2). */
export interface AtividadeEmAndamento {
  id: string;
  tipo: "sessao" | "lista" | "simulado" | "diagnostico";
  titulo: string;
  area: Area | null;
  feitas: number;
  total: number;
  atualizadaEm: string;
}

/** Marcação por questão (favorita/pra revisar) — RF, canvas de Histórico. */
export interface Marcacao {
  questaoId: string;
  favorita: boolean;
  paraRevisar: boolean;
  atualizadaEm: string;
}

export type AbaHistorico = "atividades" | "erradas" | "favoritas" | "para-revisar";

export interface FiltrosHistorico {
  periodo?: "7" | "30" | "90";
  area?: Area;
  resultado?: "acertou" | "errou";
  modo?: ModoPratica;
}

/**
 * Linha do Histórico (canvas `Telas.dc.html`, bloco `isHistorico`): uma
 * tentativa já respondida, com os dados da questão já achatados pra exibir
 * numa linha (o canvas agrupa por dia e mostra "sua resposta"/"gabarito"
 * lado a lado). Note: isto NÃO é o mesmo conceito da seção 5 do prompt de
 * paridade (lá, `AtividadeHistorico` é por sessão/lista/simulado concluído,
 * não por tentativa) — o canvas de referência mostra tentativa por
 * tentativa; ver docs/CONTRATO_PARIDADE.md.
 */
export interface ItemHistorico {
  tentativaId: string;
  questaoId: string;
  respondidaEm: string;
  area: Area;
  habilidade: Habilidade | null;
  ano: number | null;
  titulo: string;
  resposta: Letra;
  gabarito: Letra;
  correta: boolean;
  modo: ModoPratica;
  versaoModelo: string | null;
  favorita: boolean;
  paraRevisar: boolean;
}

/** Simulado (RF13) */
export interface SimuladoConfig {
  escopo: "area" | "dia" | "personalizado";
  areas: Area[];
  quantidade: number;
  ano: number | null;
  duracaoMinutos: number | null;
  cronometroVisivel: boolean;
}

export interface SimuladoResumo {
  id: string;
  status: "em_andamento" | "finalizado";
  rotulo: string;
  iniciadoEm: string;
  limiteEm: string | null;
  total: number;
  respondidas: number;
  acertos: number | null;
  duracaoSegundos: number | null;
}

export interface Simulado {
  id: string;
  config: SimuladoConfig;
  status: "em_andamento" | "finalizado";
  iniciadoEm: string;
  limiteEm: string | null;
  itens: { n: number; questao: Questao; resposta: Letra | null; marcada: boolean }[];
}

export interface ResultadoSimulado {
  simuladoId: string;
  acertos: number;
  total: number;
  emBranco: number;
  duracaoSegundos: number;
  porArea: { area: Area; acertos: number; total: number }[];
  itens: {
    n: number;
    questaoId: string;
    area: Area;
    habilidade: string | null;
    resposta: Letra | null;
    gabarito: Letra;
    correta: boolean;
    marcada: boolean;
  }[];
  habilidadesFracas: { area: Area; habilidade: Habilidade; acertos: number; total: number }[];
  proficiencias: Proficiencia[];
}

/** Conta e preferências */
export interface Perfil {
  id: string;
  nome: string;
  email: string;
  faixaEtaria: "maior_18" | "menor_18" | null;
  // apelido: nome de exibição (P2) — escola/cidade/sobre continuam de fora até a P3
  // (NEXT_PUBLIC_PERFIL_EXTRA). onboardingConcluido: quem tem false vai pra /boas-vindas.
  apelido: string | null;
  onboardingConcluido: boolean;
  criadoEm: string;
}

export interface Preferencias {
  tema: "sistema" | "claro" | "escuro";
  paleta: PaletaId;
  reduzirMovimento: "sistema" | "sim";
  tamanhoTexto: 100 | 115 | 130;
  descricaoImagensAberta: boolean;
  atalhosTeclado: boolean;
  metaSemanal: number;
}

export type CodigoErro =
  | "nao_autenticado"
  | "sem_permissao"
  | "nao_encontrado"
  | "validacao"
  | "limite_excedido"
  | "indisponivel"
  | "desconhecido";

export class ApiError extends Error {
  codigo: CodigoErro;
  detalhes?: unknown;

  constructor(codigo: CodigoErro, mensagem: string, detalhes?: unknown) {
    super(mensagem);
    this.codigo = codigo;
    this.detalhes = detalhes;
    this.name = "ApiError";
  }
}
