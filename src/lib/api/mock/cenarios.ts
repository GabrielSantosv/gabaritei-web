/**
 * Seletor de cenário do mock (seção 7.3). Troca por `?cenario=` na URL ou
 * pelo `ScenarioSwitcher` (só em desenvolvimento). Cada cenário ajusta os
 * dados semeados e o comportamento de latência/erro das chamadas.
 */
import { ApiError, type Letra, type Marcacao, type Recomendacao, type Simulado, type Tentativa } from "../types";
import { BANCO_DEMO, MOCK_MIN_RESPOSTAS } from "./dados";
import { atualizarEstado, lerEstado, type SessaoInterna } from "./estado";
import { MODELO_MOCK } from "./engine";
import { salvarFilaSessao } from "@/lib/sessao-ativa";

export type CenarioId = "novo" | "ativo" | "parcial" | "esgotado" | "lento" | "erro" | "sem-permissao";

export const CENARIOS: { id: CenarioId; rotulo: string; descricao: string }[] = [
  { id: "novo", rotulo: "Novo", descricao: "Conta sem histórico nenhum." },
  { id: "ativo", rotulo: "Ativo", descricao: "Histórico e proficiência ok em todas as áreas." },
  { id: "parcial", rotulo: "Parcial", descricao: "Algumas áreas com dados insuficientes." },
  { id: "esgotado", rotulo: "Esgotado", descricao: "Poucas questões elegíveis sobrando." },
  { id: "lento", rotulo: "Lento", descricao: "Respostas da API em ~4 s." },
  { id: "erro", rotulo: "Erro", descricao: "30 % das chamadas falham." },
  { id: "sem-permissao", rotulo: "Sem permissão", descricao: "Toda chamada volta 401/403." },
];

const CHAVE_CENARIO = "gabaritei:mock:cenario";
const PADRAO: CenarioId = "ativo";

export function lerCenarioDaUrl(): CenarioId | null {
  if (typeof window === "undefined") return null;
  const valor = new URLSearchParams(window.location.search).get("cenario");
  return CENARIOS.some((c) => c.id === valor) ? (valor as CenarioId) : null;
}

function lerCenarioSalvo(): CenarioId | null {
  if (typeof window === "undefined") return null;
  try {
    const valor = window.localStorage.getItem(CHAVE_CENARIO);
    return CENARIOS.some((c) => c.id === valor) ? (valor as CenarioId) : null;
  } catch {
    return null;
  }
}

export function cenarioAtual(): CenarioId {
  return lerCenarioDaUrl() ?? lerCenarioSalvo() ?? PADRAO;
}

function gerarTentativasSinteticas(
  taxaAcertoAlvo: number,
  quantidadePorArea: number,
  diasAtras: number,
): Tentativa[] {
  const tentativas: Tentativa[] = [];
  const areas = ["LC", "CH", "CN", "MT"] as const;
  for (const area of areas) {
    const daArea = BANCO_DEMO.filter((q) => q.questao.area === area);
    for (let i = 0; i < Math.min(quantidadePorArea, daArea.length); i += 1) {
      const q = daArea[i];
      const correta = Math.random() < taxaAcertoAlvo;
      const letras: Letra[] = ["A", "B", "C", "D", "E"];
      const resposta = correta ? q.gabarito : letras.filter((l) => l !== q.gabarito)[0];
      const diasAtrasAleatorio = Math.floor(Math.random() * diasAtras);
      const data = new Date();
      data.setDate(data.getDate() - diasAtrasAleatorio);
      tentativas.push({
        id: `seed-${area}-${i}`,
        questaoId: q.questao.id,
        resposta,
        correcao: {
          tentativaId: `seed-${area}-${i}`,
          correta,
          gabarito: q.gabarito,
          resolucao: q.resolucao,
          respondidaEm: data.toISOString(),
        },
        modo: "tema",
        versaoModelo: "0.0.0",
        sessaoId: null,
      });
    }
  }
  return tentativas;
}

function diasConsecutivos(quantidade: number): string[] {
  const dias: string[] = [];
  const base = new Date();
  for (let i = 0; i < quantidade; i += 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
}

/**
 * "Continue de onde parou" (P2, Início) precisa de atividade de verdade em
 * andamento, não só uma lista inventada — por isso cria uma SessaoInterna e um
 * Simulado reais, com questões de verdade do banco. A sessão também grava a
 * fila no sessionStorage (como um iniciarSessao de verdade faria), senão
 * "Continuar" bate no mesmo "sessão sem fila" de um reload no meio do treino
 * (TODO(equipe), ver PENDENCIAS.md) assim que a aba for aberta.
 */
function criarSessaoEmAndamentoSeed(
  id: string,
  area: "LC" | "CH" | "CN" | "MT",
  quantidade: number,
  respondidas: number,
  horasAtras: number,
): { interna: SessaoInterna; tentativas: Tentativa[]; filaRestante: Recomendacao[] } {
  const candidatos = BANCO_DEMO.filter((q) => q.questao.area === area).slice(0, quantidade);
  const letras: Letra[] = ["A", "B", "C", "D", "E"];
  const tentativas: Tentativa[] = [];
  const itensResumo: SessaoInterna["itensResumo"] = [];
  let acertos = 0;

  candidatos.slice(0, respondidas).forEach((q, i) => {
    const correta = Math.random() < 0.65;
    const resposta = correta ? q.gabarito : letras.filter((l) => l !== q.gabarito)[0];
    const tentativaId = `${id}-t${i}`;
    const respondidaEm = new Date(Date.now() - (respondidas - i) * 20 * 60_000).toISOString();
    if (correta) acertos += 1;
    tentativas.push({
      id: tentativaId,
      questaoId: q.questao.id,
      resposta,
      correcao: { tentativaId, correta, gabarito: q.gabarito, resolucao: q.resolucao, respondidaEm },
      modo: "tema",
      versaoModelo: "0.0.0",
      sessaoId: id,
    });
    itensResumo.push({
      posicao: i + 1,
      tentativaId,
      questaoId: q.questao.id,
      area: q.questao.area,
      habilidade: q.questao.habilidade?.codigo ?? null,
      letra: resposta,
      correta,
    });
  });

  const filaRestante: Recomendacao[] = candidatos.slice(respondidas).map((q, i) => ({
    id: `rec-${q.questao.id}-seed`,
    posicao: i + 1,
    questao: q.questao,
    criterio: { modo: "tema", texto: "Questão parecida com o tema que você escolheu." },
  }));

  const sessao: SessaoInterna["sessao"] = {
    id,
    modo: "tema",
    iniciadaEm: new Date(Date.now() - horasAtras * 3_600_000).toISOString(),
    encerradaEm: null,
    total: quantidade,
    respondidas,
    acertos,
    combo: null,
    duracaoSegundos: null,
  };

  return {
    interna: { sessao, fila: filaRestante, respondidasIds: itensResumo.map((it) => it.questaoId), itensResumo, pedido: { modo: "tema", areas: [area], quantidade } },
    tentativas,
    filaRestante,
  };
}

function criarSimuladoEmAndamentoSeed(
  id: string,
  area: "LC" | "CH" | "CN" | "MT",
  quantidade: number,
  respondidas: number,
  horasAtras: number,
): Simulado {
  const candidatos = BANCO_DEMO.filter((q) => q.questao.area === area).slice(0, quantidade);
  return {
    id,
    config: { escopo: "area", areas: [area], quantidade: candidatos.length, ano: null, duracaoMinutos: null, cronometroVisivel: true },
    status: "em_andamento",
    iniciadoEm: new Date(Date.now() - horasAtras * 3_600_000).toISOString(),
    limiteEm: null,
    itens: candidatos.map((q, i) => ({
      n: i + 1,
      questao: q.questao,
      resposta: i < respondidas ? q.gabarito : null,
      marcada: false,
    })),
  };
}

/**
 * Marca algumas questões já respondidas como favorita/pra revisar — só pra
 * popular as abas do Histórico com dado de demonstração; não existe tela
 * ainda pra favoritar de verdade (P5, fora desta etapa — ver CONTRATO_PARIDADE.md).
 */
function marcacoesDeExemplo(tentativas: Tentativa[], nFavoritas: number, nParaRevisar: number): Record<string, Marcacao> {
  const idsUnicos = [...new Set(tentativas.map((t) => t.questaoId))];
  const agora = new Date().toISOString();
  const marcacoes: Record<string, Marcacao> = {};
  idsUnicos.slice(0, nFavoritas).forEach((id) => {
    marcacoes[id] = { questaoId: id, favorita: true, paraRevisar: false, atualizadaEm: agora };
  });
  idsUnicos.slice(nFavoritas, nFavoritas + nParaRevisar).forEach((id) => {
    marcacoes[id] = { questaoId: id, favorita: false, paraRevisar: true, atualizadaEm: agora };
  });
  return marcacoes;
}

/** Semeia o estado local com dados coerentes para o cenário escolhido. */
export function semearCenario(cenario: CenarioId): void {
  atualizarEstado((estado) => {
    if (cenario === "novo" || cenario === "lento" || cenario === "erro" || cenario === "sem-permissao") {
      estado.tentativas = [];
      estado.diasComAtividade = [];
      estado.melhorFoguinho = 0;
      return;
    }
    if (cenario === "ativo") {
      // Volume maior que antes (65+ por área): o banco cresceu de 6 pra ~18
      // habilidades por área (Desempenho, pedido à parte) e precisa de dado
      // o bastante espalhado pra cada assunto não ficar em "poucos dados".
      estado.tentativas = gerarTentativasSinteticas(0.68, 70, 90);
      estado.diasComAtividade = diasConsecutivos(5);
      estado.melhorFoguinho = 9;

      const sessaoSeed = criarSessaoEmAndamentoSeed("seed-sessao-ativo", "MT", 10, 4, 2);
      estado.sessoes = { ["seed-sessao-ativo"]: sessaoSeed.interna };
      estado.tentativas = [...estado.tentativas, ...sessaoSeed.tentativas];
      estado.simulados = {
        ["seed-simulado-ativo"]: criarSimuladoEmAndamentoSeed("seed-simulado-ativo", "LC", 20, 12, 20),
      };
      salvarFilaSessao("seed-sessao-ativo", { itens: sessaoSeed.filaRestante, aviso: null, modelo: MODELO_MOCK });
      estado.marcacoes = marcacoesDeExemplo(estado.tentativas, 3, 5);
      return;
    }
    if (cenario === "parcial") {
      const completas = gerarTentativasSinteticas(0.62, MOCK_MIN_RESPOSTAS + 5, 45).filter(
        (t) => BANCO_DEMO.find((q) => q.questao.id === t.questaoId)?.questao.area === "MT",
      );
      const parciais = gerarTentativasSinteticas(0.5, 6, 20).filter(
        (t) => BANCO_DEMO.find((q) => q.questao.id === t.questaoId)?.questao.area === "LC",
      );
      estado.tentativas = [...completas, ...parciais];
      estado.diasComAtividade = diasConsecutivos(2);
      estado.melhorFoguinho = 4;

      const sessaoSeed = criarSessaoEmAndamentoSeed("seed-sessao-parcial", "LC", 10, 2, 5);
      estado.sessoes = { ["seed-sessao-parcial"]: sessaoSeed.interna };
      estado.tentativas = [...estado.tentativas, ...sessaoSeed.tentativas];
      salvarFilaSessao("seed-sessao-parcial", { itens: sessaoSeed.filaRestante, aviso: null, modelo: MODELO_MOCK });
      estado.marcacoes = marcacoesDeExemplo(estado.tentativas, 1, 2);
      return;
    }
    if (cenario === "esgotado") {
      // Marca quase todo o banco de uma área como respondido, para a elegibilidade esgotar rápido.
      const todasMT = BANCO_DEMO.filter((q) => q.questao.area === "MT");
      estado.tentativas = todasMT.slice(0, Math.max(0, todasMT.length - 2)).map((q, i) => ({
        id: `seed-esgotado-${i}`,
        questaoId: q.questao.id,
        resposta: q.gabarito,
        correcao: {
          tentativaId: `seed-esgotado-${i}`,
          correta: true,
          gabarito: q.gabarito,
          resolucao: q.resolucao,
          respondidaEm: new Date().toISOString(),
        },
        modo: "nivel",
        versaoModelo: "0.0.0",
        sessaoId: null,
      }));
      estado.diasComAtividade = diasConsecutivos(3);
      estado.melhorFoguinho = 3;
      return;
    }
  });
}

export function definirCenario(cenario: CenarioId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_CENARIO, cenario);
  } catch {
    // ignora
  }
  semearCenario(cenario);
}

/** Garante que o cenário atual já foi semeado (chamado uma vez por sessão do navegador). */
let semeadoNestaSessao = false;
export function garantirCenarioSemeado(): void {
  if (semeadoNestaSessao) return;
  const estado = lerEstado();
  const cenario = cenarioAtual();
  if (estado.tentativas.length === 0 && (cenario === "ativo" || cenario === "parcial" || cenario === "esgotado")) {
    semearCenario(cenario);
  }
  semeadoNestaSessao = true;
}

/* ------------------------------- latência/erro ------------------------------ */

function atraso(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Envolve toda chamada do mock: latência simulada e, conforme o cenário, erro ou negação de acesso. */
export async function comLatenciaECenario<T>(executar: () => T | Promise<T>): Promise<T> {
  const cenario = cenarioAtual();

  if (cenario === "sem-permissao") {
    await atraso(300);
    throw new ApiError("nao_autenticado", "Entre para continuar.");
  }

  const ms = cenario === "lento" ? 4000 : 300 + Math.random() * 600;
  await atraso(ms);

  if (cenario === "erro" && Math.random() < 0.3) {
    throw new ApiError("indisponivel", "Não conseguimos completar a ação agora. Tente de novo.");
  }

  return executar();
}

export const DEMO_AVISO_FIXO = "Dados de demonstração";
