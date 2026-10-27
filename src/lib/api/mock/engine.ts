/**
 * "Servidor falso": versão mínima das regras de negócio (docs/FRONTEND_PROMPT.md,
 * seção 7.3). Não tem pretensão de ser o recomendador de verdade — só dá às
 * telas estados reais (elegibilidade, critério, Combo, Foguinho, proficiência)
 * para exercitar a interface. Regra de negócio de verdade vem da API no futuro.
 */
import type {
  Area,
  Aviso,
  ComboConfig,
  ComboEstado,
  Criterio,
  Faixa,
  Habilidade,
  Letra,
  PedidoRecomendacao,
  Proficiencia,
  Recomendacao,
  Reforco,
  StatusDados,
} from "../types";
import { BANCO_DEMO, HABILIDADES, MOCK_MIN_RESPOSTAS, type QuestaoComGabarito } from "./dados";

export const MODELO_MOCK = { nome: "mock", versao: "0.0.0" };

// TODO(equipe): valores reais da regra do Combo (RF18).
export const COMBO_CONFIG_PADRAO: ComboConfig = { acertosPorDegrau: 3, noErro: "reduz" };

const DEGRAUS: Faixa[] = ["facil", "media", "dificil"];

export interface TentativaRegistrada {
  questaoId: string;
  area: Area;
  habilidade: string | null;
  correta: boolean;
  modo: string;
  respondidaEm: string;
}

/* ----------------------------- elegibilidade ----------------------------- */

export function questoesDaArea(areas: Area[] | undefined): QuestaoComGabarito[] {
  if (!areas || areas.length === 0) return BANCO_DEMO;
  return BANCO_DEMO.filter((q) => areas.includes(q.questao.area));
}

function textoDoBloco(q: QuestaoComGabarito): string {
  return q.questao.enunciado
    .map((b) => (b.tipo === "texto" || b.tipo === "citacao" ? b.texto : ""))
    .join(" ")
    .toLowerCase();
}

function pontuarSimilaridade(texto: string, referencia: string): number {
  const palavrasRef = new Set(referencia.toLowerCase().split(/\W+/).filter((p) => p.length > 3));
  if (palavrasRef.size === 0) return 0;
  let pontos = 0;
  for (const palavra of palavrasRef) {
    if (texto.includes(palavra)) pontos += 1;
  }
  return pontos;
}

/* ------------------------------- critérios -------------------------------- */

function textoCriterio(
  modo: Criterio["modo"],
  opts: { area?: Area; habilidade?: Habilidade | null; faixaAlvo?: Faixa; taxaAcerto?: number },
): string {
  switch (modo) {
    case "tema":
      return "Questão parecida com o tema que você escolheu.";
    case "habilidade":
      return opts.habilidade
        ? `Mesma habilidade (${opts.habilidade.codigo}) em que você acertou ${Math.round((opts.taxaAcerto ?? 0) * 100)} %.`
        : "Habilidade entre as prioridades de reforço.";
    case "nivel":
      return `Dificuldade ${rotuloFaixa(opts.faixaAlvo ?? "media").toLowerCase()}, compatível com sua proficiência estimada em ${opts.area ?? "?"}.`;
    case "progressao":
      return `Combo em andamento: próxima questão na faixa ${rotuloFaixa(opts.faixaAlvo ?? "media").toLowerCase()}.`;
    default:
      return "Recomendada pelo modelo.";
  }
}

export function rotuloFaixa(faixa: Faixa): string {
  if (faixa === "facil") return "Fácil";
  if (faixa === "dificil") return "Difícil";
  return "Média";
}

/* ------------------------------ recomendação ------------------------------ */

export interface ContextoRecomendacao {
  tentativas: TentativaRegistrada[];
  idsRespondidasNestaSessao?: string[];
  comboFaixaAlvo?: Faixa;
}

function habilidadesPrioritarias(
  tentativas: TentativaRegistrada[],
  areas: Area[] | undefined,
): { habilidade: string; area: Area; taxaAcerto: number; respostas: number }[] {
  const porHabilidade = new Map<string, { area: Area; acertos: number; total: number }>();
  for (const t of tentativas) {
    if (!t.habilidade) continue;
    if (areas && areas.length > 0 && !areas.includes(t.area)) continue;
    const chave = t.habilidade;
    const atual = porHabilidade.get(chave) ?? { area: t.area, acertos: 0, total: 0 };
    atual.total += 1;
    if (t.correta) atual.acertos += 1;
    porHabilidade.set(chave, atual);
  }
  return [...porHabilidade.entries()]
    .filter(([, v]) => v.total >= 3) // TODO(equipe): volume mínimo para apontar reforço por habilidade (RF10)
    .map(([habilidade, v]) => ({
      habilidade,
      area: v.area,
      taxaAcerto: v.acertos / v.total,
      respostas: v.total,
    }))
    .sort((a, b) => a.taxaAcerto - b.taxaAcerto);
}

function proficienciaSimples(
  tentativas: TentativaRegistrada[],
  area: Area,
): { status: StatusDados; valor: number | null; respostas: number } {
  const daArea = tentativas.filter((t) => t.area === area);
  const respostas = daArea.length;
  if (respostas < MOCK_MIN_RESPOSTAS) return { status: "dados_insuficientes", valor: null, respostas };
  const acertos = daArea.filter((t) => t.correta).length;
  const taxa = acertos / respostas;
  // Proxy grosseiro de proficiência (não é o modelo TRI real): mapeia a taxa de
  // acerto para uma escala de -3 a 3. TODO(equipe): escala e modelo definitivos.
  const valor = Number((Math.max(0, Math.min(1, taxa)) * 6 - 3).toFixed(2));
  return { status: "ok", valor, respostas };
}

function faixaAlvoPorProficiencia(valor: number | null): Faixa {
  if (valor === null) return "media";
  if (valor < -1) return "facil";
  if (valor > 1) return "dificil";
  return "media";
}

function montarRecomendacao(
  q: QuestaoComGabarito,
  posicao: number,
  criterio: Criterio,
): Recomendacao {
  return { id: `rec-${q.questao.id}-${posicao}`, posicao, questao: q.questao, criterio };
}

export function gerarRecomendacoes(
  pedido: PedidoRecomendacao,
  contexto: ContextoRecomendacao,
): { itens: Recomendacao[]; aviso: Aviso | null } {
  const quantidade = pedido.quantidade ?? 5;
  const respondidasNaSessao = new Set(contexto.idsRespondidasNestaSessao ?? []);
  const semHistorico = contexto.tentativas.length === 0;

  let modoEfetivo = pedido.modo;
  let avisoSemHistorico: Aviso | null = null;
  if (semHistorico && modoEfetivo !== "tema") {
    modoEfetivo = "tema";
    avisoSemHistorico = {
      tipo: "sem_historico",
      texto: "Você ainda não tem histórico suficiente. Por enquanto, usamos o tema escolhido.",
    };
  }

  let candidatos = questoesDaArea(pedido.areas).filter((q) => !respondidasNaSessao.has(q.questao.id));

  // Assunto (Desempenho/Treino, pedido à parte): filtro universal, vale pra
  // qualquer modo — "treinar o assunto inteiro" restringe o banco de questões
  // antes do critério de cada modo entrar (tema ainda busca por semelhança de
  // texto, só que dentro do assunto; habilidade ainda escolhe uma prioridade,
  // só que entre as do assunto).
  if (!pedido.habilidade && pedido.habilidades && pedido.habilidades.length > 0) {
    const codigosDoAssunto = pedido.habilidades;
    candidatos = candidatos.filter((q) => q.questao.habilidade && codigosDoAssunto.includes(q.questao.habilidade.codigo));
  }

  let aviso: Aviso | null = avisoSemHistorico;
  let faixaAlvo: Faixa | undefined;
  let habilidadeAlvo: Habilidade | null = null;
  const areaAlvo: Area | undefined = pedido.areas?.[0];

  if (modoEfetivo === "tema") {
    const referencia =
      pedido.temaTexto ??
      (pedido.questaoBaseId ? textoDoBloco(BANCO_DEMO.find((q) => q.questao.id === pedido.questaoBaseId) ?? candidatos[0]) : "");
    if (referencia) {
      candidatos = [...candidatos].sort(
        (a, b) => pontuarSimilaridade(textoDoBloco(b), referencia) - pontuarSimilaridade(textoDoBloco(a), referencia),
      );
    }
  } else if (modoEfetivo === "habilidade") {
    // Bug real corrigido: com assunto (pedido.habilidades, plural) e sem uma
    // habilidade específica escolhida, este branch caía no fallback de baixo
    // (prioridades[0], a prioridade GLOBAL de reforço) e refiltrava candidatos
    // só por ela — ignorando o assunto já aplicado acima e, pior, mostrando no
    // critério uma habilidade de outro assunto. Sem habilidade única, deixa
    // candidatos como o filtro de assunto já deixou; o critério de cada
    // questão usa a própria habilidade dela (varia dentro do assunto).
    if (!pedido.habilidade && pedido.habilidades && pedido.habilidades.length > 0) {
      habilidadeAlvo = null;
    } else {
      const prioridades = habilidadesPrioritarias(contexto.tentativas, pedido.areas);
      const alvo = pedido.habilidade ?? prioridades[0]?.habilidade;
      habilidadeAlvo = alvo ? BANCO_DEMO.find((q) => q.questao.habilidade?.codigo === alvo)?.questao.habilidade ?? null : null;
      if (alvo) candidatos = candidatos.filter((q) => q.questao.habilidade?.codigo === alvo);
    }
  } else if (modoEfetivo === "nivel") {
    const area = areaAlvo ?? "MT";
    const prof = proficienciaSimples(contexto.tentativas, area);
    faixaAlvo = faixaAlvoPorProficiencia(prof.valor);
    candidatos = candidatos.filter((q) => q.questao.faixa === faixaAlvo);
  } else if (modoEfetivo === "progressao") {
    faixaAlvo = contexto.comboFaixaAlvo ?? "media";
    candidatos = candidatos.filter((q) => q.questao.faixa === faixaAlvo);
  }

  if (candidatos.length < quantidade && faixaAlvo) {
    // amplia a faixa antes de reapresentar (RF11)
    const semFaixa = questoesDaArea(pedido.areas).filter(
      (q) => !respondidasNaSessao.has(q.questao.id) && (!habilidadeAlvo || q.questao.habilidade?.codigo === habilidadeAlvo.codigo),
    );
    if (semFaixa.length > candidatos.length) {
      candidatos = semFaixa;
      aviso = aviso ?? { tipo: "faixa_ampliada", texto: "Ampliamos a faixa de dificuldade para ter questões suficientes." };
    }
  }

  if (candidatos.length < quantidade) {
    const todasDaArea = questoesDaArea(pedido.areas);
    if (todasDaArea.length > candidatos.length) {
      candidatos = todasDaArea;
      aviso = aviso ?? { tipo: "reapresentadas", texto: "Algumas questões podem se repetir: as elegíveis para este filtro acabaram." };
    } else if (candidatos.length === 0) {
      aviso = { tipo: "poucas_elegiveis", texto: "Não há questões suficientes para esta combinação de filtros." };
    }
  }

  const criterioModo: Criterio["modo"] = modoEfetivo;
  const prioridadesParaTexto = modoEfetivo === "habilidade" ? habilidadesPrioritarias(contexto.tentativas, pedido.areas) : [];

  const itens = candidatos.slice(0, quantidade).map((q, i) => {
    const criterio: Criterio = {
      modo: criterioModo,
      texto: textoCriterio(criterioModo, {
        area: q.questao.area,
        habilidade: habilidadeAlvo ?? q.questao.habilidade,
        faixaAlvo: faixaAlvo ?? q.questao.faixa ?? "media",
        taxaAcerto: prioridadesParaTexto.find((p) => p.habilidade === q.questao.habilidade?.codigo)?.taxaAcerto,
      }),
      area: q.questao.area,
      habilidade: (habilidadeAlvo ?? q.questao.habilidade)?.codigo,
      faixaAlvo: faixaAlvo ?? q.questao.faixa ?? undefined,
    };
    return montarRecomendacao(q, i + 1, criterio);
  });

  return { itens, aviso };
}

/* --------------------------------- Combo ---------------------------------- */

export function estadoInicialCombo(config: ComboConfig = COMBO_CONFIG_PADRAO): ComboEstado {
  return {
    atual: 0,
    melhor: 0,
    degrau: 0,
    degrausTotal: DEGRAUS.length,
    faixaAlvo: DEGRAUS[0],
    acertosParaSubir: config.acertosPorDegrau,
    evento: null,
    config,
  };
}

export function reduzirCombo(estado: ComboEstado, acertou: boolean): ComboEstado {
  const config = estado.config;
  if (acertou) {
    const atual = estado.atual + 1;
    const melhor = Math.max(estado.melhor, atual);
    if (atual >= config.acertosPorDegrau && estado.degrau < DEGRAUS.length - 1) {
      const degrau = estado.degrau + 1;
      return {
        ...estado,
        atual: 0,
        melhor,
        degrau,
        faixaAlvo: DEGRAUS[degrau],
        acertosParaSubir: config.acertosPorDegrau,
        evento: "subiu",
      };
    }
    if (atual >= config.acertosPorDegrau && estado.degrau === DEGRAUS.length - 1) {
      return { ...estado, atual, melhor, acertosParaSubir: null, evento: "no_topo" };
    }
    return {
      ...estado,
      atual,
      melhor,
      acertosParaSubir: config.acertosPorDegrau - atual,
      evento: null,
    };
  }

  if (config.noErro === "reinicia" || estado.degrau === 0) {
    return {
      ...estado,
      atual: 0,
      degrau: 0,
      faixaAlvo: DEGRAUS[0],
      acertosParaSubir: config.acertosPorDegrau,
      evento: "reiniciou",
    };
  }

  const degrau = estado.degrau - 1;
  return {
    ...estado,
    atual: 0,
    degrau,
    faixaAlvo: DEGRAUS[degrau],
    acertosParaSubir: config.acertosPorDegrau,
    evento: "desceu",
  };
}

/* -------------------------------- Foguinho --------------------------------- */

export function calcularFoguinho(
  diasComAtividade: string[],
  melhorRegistrado: number,
  hoje = new Date(),
): { atual: number; melhor: number; hojeContou: boolean; emRisco: boolean } {
  const dias = new Set(diasComAtividade);
  const chave = (d: Date) => d.toISOString().slice(0, 10);
  const hojeChave = chave(hoje);
  const hojeContou = dias.has(hojeChave);

  let atual = 0;
  const cursor = new Date(hoje);
  if (!hojeContou) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(chave(cursor))) {
    atual += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const melhor = Math.max(melhorRegistrado, atual);
  const emRisco = !hojeContou && atual > 0;
  return { atual, melhor, hojeContou, emRisco };
}

/* ------------------------------- Proficiência ------------------------------ */

export function calcularProficiencias(tentativas: TentativaRegistrada[]): Proficiencia[] {
  const areas: Area[] = ["LC", "CH", "CN", "MT"];
  return areas.map((area) => {
    const { status, valor, respostas } = proficienciaSimples(tentativas, area);
    const anteriores = tentativas.filter((t) => t.area === area).slice(0, -5);
    const recentes = tentativas.filter((t) => t.area === area).slice(-5);
    const taxaAnterior = anteriores.length ? anteriores.filter((t) => t.correta).length / anteriores.length : null;
    const taxaRecente = recentes.length ? recentes.filter((t) => t.correta).length / recentes.length : null;
    const tendencia =
      taxaAnterior === null || taxaRecente === null
        ? null
        : taxaRecente > taxaAnterior + 0.05
          ? "subindo"
          : taxaRecente < taxaAnterior - 0.05
            ? "caindo"
            : "estavel";

    return {
      area,
      status,
      valor,
      intervalo: valor === null ? null : [Number((valor - 0.4).toFixed(2)), Number((valor + 0.4).toFixed(2))],
      respostasConsideradas: respostas,
      respostasMinimas: MOCK_MIN_RESPOSTAS,
      rotuloEscala: "escala de -3 a 3 (TODO(equipe): escala definitiva)",
      tendencia,
      atualizadaEm: respostas > 0 ? new Date().toISOString() : null,
    };
  });
}

export function calcularReforco(tentativas: TentativaRegistrada[]): Reforco {
  const total = tentativas.length;
  const prioridades = habilidadesPrioritarias(tentativas, undefined).slice(0, 5);
  const status: StatusDados = total >= 15 && prioridades.length > 0 ? "ok" : "dados_insuficientes";
  return {
    status,
    respostasAtuais: total,
    respostasMinimas: 15, // TODO(equipe): volume mínimo para reforço (RF10)
    prioridades: prioridades.map((p, i) => ({
      posicao: i + 1,
      area: p.area,
      habilidade: HABILIDADES.find((h) => h.codigo === p.habilidade) ?? {
        codigo: p.habilidade,
        descricao: null,
        area: p.area,
        assunto: "",
      },
      taxaAcerto: p.taxaAcerto,
      respostas: p.respostas,
    })),
  };
}

export function letraCorreta(questaoId: string): Letra | null {
  return BANCO_DEMO.find((q) => q.questao.id === questaoId)?.gabarito ?? null;
}

/**
 * "Deixar o modelo escolher" (P2, Início): só é modelDriven (selo de IA) quando
 * existe uma prioridade de reforço de verdade (mesmo volume mínimo de
 * habilidadesPrioritarias, RF10) — sem isso, cai no modo tema genérico, sem
 * selo, porque não houve critério nenhum pra decidir (regra 9: âmbar exclusivo
 * de conteúdo de IA de verdade, nunca decoração).
 */
export function escolherModoAutomatico(
  tentativas: TentativaRegistrada[],
): { pedido: PedidoRecomendacao; modelDriven: boolean } {
  const prioridades = habilidadesPrioritarias(tentativas, undefined);
  const alvo = prioridades[0];
  if (alvo) {
    return {
      pedido: { modo: "habilidade", habilidade: alvo.habilidade, areas: [alvo.area] },
      modelDriven: true,
    };
  }
  return { pedido: { modo: "tema" }, modelDriven: false };
}
