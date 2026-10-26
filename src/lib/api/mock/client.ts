import type { Api } from "../client";
import {
  ApiError,
  type AbaHistorico,
  type Area,
  type AtividadeEmAndamento,
  type ComboEstado,
  type Correcao,
  type EnvioResposta,
  type EnvioResultado,
  type FiltrosHistorico,
  type FiltrosQuestoes,
  type Habilidade,
  type ItemHistorico,
  type Letra,
  type Marcacao,
  type Pagina,
  type ParamsSessao,
  type ParamsSessaoAuto,
  type PedidoRecomendacao,
  type Perfil,
  type Preferencias,
  type Proficiencia,
  type QuestaoResumo,
  type RecomendacaoResposta,
  type Reforco,
  type Regularidade,
  type ResultadoSimulado,
  type ResumoGeral,
  type ResumoSessao,
  type Sessao,
  type Simulado,
  type SimuladoConfig,
  type SimuladoResumo,
  type Tentativa,
} from "../types";
import { truncarNaPalavra } from "@/lib/format";
import { BANCO_DEMO, HABILIDADES, questaoPorId } from "./dados";
import { comLatenciaECenario, garantirCenarioSemeado } from "./cenarios";
import {
  calcularFoguinho,
  calcularProficiencias,
  calcularReforco,
  COMBO_CONFIG_PADRAO,
  escolherModoAutomatico,
  estadoInicialCombo,
  gerarRecomendacoes,
  letraCorreta,
  MODELO_MOCK,
  reduzirCombo,
  type TentativaRegistrada,
} from "./engine";
import {
  atualizarEstado,
  definirSessaoAutenticada,
  lerEstado,
  proximoId,
  temSessaoAutenticada,
  type SessaoInterna,
} from "./estado";

function exigirAutenticacao(): void {
  if (!temSessaoAutenticada()) {
    throw new ApiError("nao_autenticado", "Entre para continuar.");
  }
}

const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

/** "Continue de onde parou" (P2): um nome curto pra sessão, pelo que ela foi pedida. */
function tituloDaSessao(s: SessaoInterna): string {
  if (s.pedido.modo === "tema" && s.pedido.temaTexto) return `Tema: ${s.pedido.temaTexto}`;
  if (s.pedido.modo === "habilidade" && s.pedido.habilidade) return `Habilidade ${s.pedido.habilidade}`;
  if (s.pedido.areas?.length === 1) return NOME_AREA[s.pedido.areas[0]];
  return "Seleção automática";
}

function ultimaAtividadeEm(s: SessaoInterna, tentativas: Tentativa[]): string {
  const ultimo = s.itensResumo.at(-1);
  if (!ultimo) return s.sessao.iniciadaEm;
  const tentativa = tentativas.find((t) => t.id === ultimo.tentativaId);
  return tentativa?.correcao.respondidaEm ?? s.sessao.iniciadaEm;
}

function paraTentativaRegistrada(t: Tentativa): TentativaRegistrada {
  const q = questaoPorId(t.questaoId);
  return {
    questaoId: t.questaoId,
    area: q?.questao.area ?? "MT",
    habilidade: q?.questao.habilidade?.codigo ?? null,
    correta: t.correcao.correta,
    modo: t.modo,
    respondidaEm: t.correcao.respondidaEm,
  };
}

function registrarAtividadeHoje(): void {
  atualizarEstado((estado) => {
    const hoje = new Date().toISOString().slice(0, 10);
    if (!estado.diasComAtividade.includes(hoje)) {
      estado.diasComAtividade = [...estado.diasComAtividade, hoje];
    }
    const { atual } = calcularFoguinho(estado.diasComAtividade, estado.melhorFoguinho);
    estado.melhorFoguinho = Math.max(estado.melhorFoguinho, atual);
  });
}

function criarQueueCompleta(pedido: PedidoRecomendacao, idsExcluidos: string[]) {
  const quantidadeTotal = pedido.quantidade ?? 5;
  const excluidos = new Set(idsExcluidos);
  const itensAcumulados: RecomendacaoResposta["itens"] = [];
  let avisoFinal: RecomendacaoResposta["aviso"] = null;

  while (itensAcumulados.length < quantidadeTotal) {
    const faltam = quantidadeTotal - itensAcumulados.length;
    const { tentativas } = lerEstado();
    const { itens, aviso } = gerarRecomendacoes(
      { ...pedido, quantidade: Math.min(5, faltam) },
      {
        tentativas: tentativas.map(paraTentativaRegistrada),
        idsRespondidasNestaSessao: [...excluidos],
      },
    );
    if (aviso) avisoFinal = aviso;
    if (itens.length === 0) break;
    for (const item of itens) {
      itensAcumulados.push({ ...item, posicao: itensAcumulados.length + 1 });
      excluidos.add(item.questao.id);
    }
  }

  return { itens: itensAcumulados, aviso: avisoFinal };
}

export const mockApi: Api = {
  async entrar({ email, senha }) {
    return comLatenciaECenario(() => {
      if (senha.length < 6) {
        throw new ApiError("validacao", "E-mail ou senha incorretos. Confira os dados e tente de novo.");
      }
      const estado = lerEstado();
      const perfil: Perfil = estado.perfil ?? {
        id: "usuario-demo",
        // Nome fixo de demonstração, nunca derivado do e-mail (seção 6, etapa V):
        // "nome: email.split('@')[0]" produzia saudações tipo "Olá, santoz".
        nome: "Marina",
        email,
        faixaEtaria: null,
        apelido: null,
        // true: "entrar" é login, não cadastro — a conta demo já passou dos
        // primeiros passos. Só "cadastrar" (abaixo) começa com false.
        onboardingConcluido: true,
        criadoEm: new Date().toISOString(),
      };
      atualizarEstado((e) => {
        e.perfil = perfil;
      });
      definirSessaoAutenticada(true);
      garantirCenarioSemeado();
      return perfil;
    });
  },

  async cadastrar({ nome, email, senha, faixaEtaria }) {
    return comLatenciaECenario(() => {
      if (senha.length < 6) {
        throw new ApiError("validacao", "A senha precisa ter pelo menos 6 caracteres.");
      }
      const estado = lerEstado();
      if (estado.perfil && estado.perfil.email === email) {
        throw new ApiError("validacao", "Este e-mail já está cadastrado. Entre com sua conta.", {
          tipo: "email_em_uso",
        });
      }
      const perfil: Perfil = {
        id: "usuario-demo",
        nome,
        email,
        faixaEtaria,
        apelido: null,
        onboardingConcluido: false,
        criadoEm: new Date().toISOString(),
      };
      atualizarEstado((e) => {
        e.perfil = perfil;
        e.tentativas = [];
        e.diasComAtividade = [];
        e.melhorFoguinho = 0;
      });
      definirSessaoAutenticada(true);
      return perfil;
    });
  },

  async sair() {
    return comLatenciaECenario(() => {
      definirSessaoAutenticada(false);
    });
  },

  async obterUsuarioAtual() {
    return comLatenciaECenario(() => {
      if (!temSessaoAutenticada()) return null;
      return lerEstado().perfil;
    });
  },

  async obterPerfil() {
    return comLatenciaECenario(() => {
      exigirAutenticacao();
      const perfil = lerEstado().perfil;
      if (!perfil) throw new ApiError("nao_encontrado", "Perfil não encontrado.");
      return perfil;
    });
  },

  async atualizarPerfil(input) {
    return comLatenciaECenario(() => {
      exigirAutenticacao();
      const estado = atualizarEstado((e) => {
        if (e.perfil) e.perfil = { ...e.perfil, ...input };
      });
      if (!estado.perfil) throw new ApiError("nao_encontrado", "Perfil não encontrado.");
      return estado.perfil;
    });
  },

  async obterPreferencias() {
    return comLatenciaECenario(() => lerEstado().preferencias);
  },

  async atualizarPreferencias(input) {
    return comLatenciaECenario(() => {
      const estado = atualizarEstado((e) => {
        e.preferencias = { ...e.preferencias, ...input } satisfies Preferencias;
      });
      return estado.preferencias;
    });
  },

  async listarQuestoes(filtros: FiltrosQuestoes, pagina: { pagina: number; porPagina: number }) {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      let filtradas = BANCO_DEMO;
      if (filtros.areas?.length) filtradas = filtradas.filter((q) => filtros.areas!.includes(q.questao.area));
      if (filtros.habilidades?.length)
        filtradas = filtradas.filter((q) => q.questao.habilidade && filtros.habilidades!.includes(q.questao.habilidade.codigo));
      if (filtros.anos?.length) filtradas = filtradas.filter((q) => q.questao.ano !== null && filtros.anos!.includes(q.questao.ano));
      if (filtros.faixas?.length) filtradas = filtradas.filter((q) => q.questao.faixa !== null && filtros.faixas!.includes(q.questao.faixa));

      const total = filtradas.length;
      const inicio = (pagina.pagina - 1) * pagina.porPagina;
      const pagina_ = filtradas.slice(inicio, inicio + pagina.porPagina);

      const itens: QuestaoResumo[] = pagina_.map((q) => {
        const ultima = [...estado.tentativas]
          .filter((t) => t.questaoId === q.questao.id)
          .sort((a, b) => b.correcao.respondidaEm.localeCompare(a.correcao.respondidaEm))[0];
        return {
          id: q.questao.id,
          area: q.questao.area,
          ano: q.questao.ano,
          habilidade: q.questao.habilidade,
          faixa: q.questao.faixa,
          trecho: truncarNaPalavra(q.questao.enunciado.find((b) => b.tipo === "texto")?.texto ?? "", 140),
          ultimaTentativa: ultima ? (ultima.correcao.correta ? "acertou" : "errou") : null,
        };
      });

      return { itens, total, pagina: pagina.pagina, porPagina: pagina.porPagina } satisfies Pagina<QuestaoResumo>;
    });
  },

  async obterQuestao(id: string) {
    return comLatenciaECenario(() => {
      const registro = questaoPorId(id);
      if (!registro) throw new ApiError("nao_encontrado", "Não encontramos essa questão.");
      return registro.questao;
    });
  },

  async listarHabilidades() {
    return comLatenciaECenario(() => HABILIDADES);
  },

  async obterRecomendacoes(pedido: PedidoRecomendacao) {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      const { itens, aviso } = gerarRecomendacoes(pedido, {
        tentativas: estado.tentativas.map(paraTentativaRegistrada),
      });
      return { itens, modelo: MODELO_MOCK, aviso } satisfies RecomendacaoResposta;
    });
  },

  async iniciarSessao(entrada: ParamsSessao | ParamsSessaoAuto) {
    return comLatenciaECenario(() => {
      // "Deixar o modelo escolher" (P2, Início): resolve pra um ParamsSessao de
      // verdade antes de tudo — Sessao.modo nunca guarda "auto". modelDriven
      // decide se o resultado leva o selo de IA (regra 9) ou NotaNeutra.
      let params: ParamsSessao;
      let modelDriven = true;
      if (entrada.modo === "auto") {
        const { tentativas } = lerEstado();
        const escolha = escolherModoAutomatico(tentativas.map(paraTentativaRegistrada));
        params = { ...escolha.pedido, quantidade: 10 };
        modelDriven = escolha.modelDriven;
      } else {
        params = entrada;
      }

      const id = proximoId("sessao");
      const agora = new Date().toISOString();

      // O Combo é rastreado em toda sessão de treino (aparece no painel e no
      // resumo), mas só o modo progressão usa a faixa-alvo dele para escolher
      // a próxima questão (seção 9: "O Combo aparece durante a sessão").
      const combo: ComboEstado = estadoInicialCombo(COMBO_CONFIG_PADRAO);

      let itens: RecomendacaoResposta["itens"] = [];
      let aviso: RecomendacaoResposta["aviso"] = null;

      if (params.modo === "progressao") {
        const resultado = criarQueueCompleta({ ...params, quantidade: 1 }, []);
        itens = resultado.itens;
        aviso = resultado.aviso;
      } else {
        const resultado = criarQueueCompleta(params, []);
        itens = resultado.itens;
        aviso = resultado.aviso;
      }

      const sessao: Sessao = {
        id,
        modo: params.modo,
        iniciadaEm: agora,
        encerradaEm: null,
        total: params.quantidade,
        respondidas: 0,
        acertos: 0,
        combo,
        duracaoSegundos: 0,
      };

      const interna: SessaoInterna = {
        sessao,
        fila: itens,
        respondidasIds: [],
        itensResumo: [],
        pedido: params,
      };

      atualizarEstado((e) => {
        e.sessoes[id] = interna;
      });

      return { sessao, primeira: { itens, modelo: modelDriven ? MODELO_MOCK : null, aviso } };
    });
  },

  async obterSessao(id: string) {
    return comLatenciaECenario(() => {
      const interna = lerEstado().sessoes[id];
      if (!interna) throw new ApiError("nao_encontrado", "Sessão não encontrada.");
      return interna.sessao;
    });
  },

  async encerrarSessao(id: string) {
    return comLatenciaECenario(() => {
      const estado = atualizarEstado((e) => {
        const interna = e.sessoes[id];
        if (interna) {
          const agora = new Date();
          interna.sessao.encerradaEm = agora.toISOString();
          interna.sessao.duracaoSegundos = Math.max(
            0,
            Math.round((agora.getTime() - new Date(interna.sessao.iniciadaEm).getTime()) / 1000),
          );
        }
      });
      const interna = estado.sessoes[id];
      if (!interna) throw new ApiError("nao_encontrado", "Sessão não encontrada.");
      return montarResumoSessao(interna);
    });
  },

  async obterResumoSessao(id: string) {
    return comLatenciaECenario(() => {
      const interna = lerEstado().sessoes[id];
      if (!interna) throw new ApiError("nao_encontrado", "Sessão não encontrada.");
      return montarResumoSessao(interna);
    });
  },

  async enviarResposta(envio: EnvioResposta) {
    return comLatenciaECenario(() => {
      const registro = questaoPorId(envio.questaoId);
      if (!registro) throw new ApiError("nao_encontrado", "Não encontramos essa questão.");

      const correta = envio.letra === registro.gabarito;
      const tentativaId = proximoId("tentativa");
      const correcao: Correcao = {
        tentativaId,
        correta,
        gabarito: registro.gabarito,
        resolucao: registro.resolucao,
        respondidaEm: new Date().toISOString(),
      };
      const tentativa: Tentativa = {
        id: tentativaId,
        questaoId: envio.questaoId,
        resposta: envio.letra,
        correcao,
        modo: envio.modo,
        versaoModelo: MODELO_MOCK.versao,
        sessaoId: envio.sessaoId,
      };

      let comboAtualizado: ComboEstado | null = null;
      let proxima: RecomendacaoResposta["itens"][number] | null = null;

      const estado = atualizarEstado((e) => {
        e.tentativas = [...e.tentativas, tentativa];

        if (envio.sessaoId) {
          const interna = e.sessoes[envio.sessaoId];
          if (interna) {
            interna.respondidasIds = [...interna.respondidasIds, envio.questaoId];
            interna.sessao.respondidas += 1;
            if (correta) interna.sessao.acertos += 1;
            if (interna.sessao.combo) {
              interna.sessao.combo = reduzirCombo(interna.sessao.combo, correta);
            }
            interna.itensResumo = [
              ...interna.itensResumo,
              {
                posicao: interna.itensResumo.length + 1,
                tentativaId,
                questaoId: envio.questaoId,
                area: registro.questao.area,
                habilidade: registro.questao.habilidade?.codigo ?? null,
                letra: envio.letra,
                correta,
              },
            ];

            if (interna.sessao.modo === "progressao" && interna.sessao.combo) {
              const faixaAlvo = interna.sessao.combo.faixaAlvo;
              const { itens } = gerarRecomendacoes(
                { modo: "progressao", areas: interna.pedido.areas, quantidade: 1 },
                {
                  tentativas: e.tentativas.map(paraTentativaRegistrada),
                  idsRespondidasNestaSessao: interna.respondidasIds,
                  comboFaixaAlvo: faixaAlvo,
                },
              );
              proxima = itens[0] ?? null;
              if (proxima) interna.fila = [...interna.fila, proxima];
            }
          }
        }
      });

      registrarAtividadeHoje();
      if (envio.sessaoId) {
        comboAtualizado = estado.sessoes[envio.sessaoId]?.sessao.combo ?? null;
      }

      return { correcao, combo: comboAtualizado, proxima } satisfies EnvioResultado;
    });
  },

  async obterTentativa(id: string) {
    return comLatenciaECenario(() => {
      const tentativa = lerEstado().tentativas.find((t) => t.id === id);
      if (!tentativa) throw new ApiError("nao_encontrado", "Tentativa não encontrada.");
      return tentativa;
    });
  },

  async listarHistorico(aba: AbaHistorico, filtros: FiltrosHistorico, paginacao: { pagina: number; porPagina: number }) {
    return comLatenciaECenario(() => {
      const estado = lerEstado();

      let itens: ItemHistorico[] = estado.tentativas
        .filter((t) => t.resposta !== null)
        .map((t) => {
          const registro = questaoPorId(t.questaoId);
          if (!registro) return null;
          const marcacao = estado.marcacoes[t.questaoId];
          return {
            tentativaId: t.id,
            questaoId: t.questaoId,
            respondidaEm: t.correcao.respondidaEm,
            area: registro.questao.area,
            habilidade: registro.questao.habilidade,
            ano: registro.questao.ano,
            titulo: truncarNaPalavra(registro.questao.enunciado.find((b) => b.tipo === "texto")?.texto ?? "", 80),
            resposta: t.resposta as Letra,
            gabarito: t.correcao.gabarito,
            correta: t.correcao.correta,
            modo: t.modo,
            versaoModelo: t.versaoModelo,
            favorita: marcacao?.favorita ?? false,
            paraRevisar: marcacao?.paraRevisar ?? false,
          } satisfies ItemHistorico;
        })
        .filter((i): i is ItemHistorico => i !== null);

      if (aba === "erradas") itens = itens.filter((i) => !i.correta);
      else if (aba === "favoritas") itens = itens.filter((i) => i.favorita);
      else if (aba === "para-revisar") itens = itens.filter((i) => i.paraRevisar);

      if (filtros.area) itens = itens.filter((i) => i.area === filtros.area);
      if (filtros.resultado) itens = itens.filter((i) => (filtros.resultado === "acertou" ? i.correta : !i.correta));
      if (filtros.modo) itens = itens.filter((i) => i.modo === filtros.modo);
      if (filtros.periodo) {
        const corte = new Date();
        corte.setDate(corte.getDate() - Number(filtros.periodo));
        itens = itens.filter((i) => new Date(i.respondidaEm) >= corte);
      }

      itens.sort((a, b) => b.respondidaEm.localeCompare(a.respondidaEm));

      const total = itens.length;
      const inicio = (paginacao.pagina - 1) * paginacao.porPagina;
      const itensDaPagina = itens.slice(inicio, inicio + paginacao.porPagina);

      return {
        itens: itensDaPagina,
        total,
        pagina: paginacao.pagina,
        porPagina: paginacao.porPagina,
      } satisfies Pagina<ItemHistorico>;
    });
  },

  async definirMarcacao(questaoId: string, input: Partial<Pick<Marcacao, "favorita" | "paraRevisar">>) {
    return comLatenciaECenario(() => {
      const agora = new Date().toISOString();
      const estado = atualizarEstado((e) => {
        const atual = e.marcacoes[questaoId] ?? {
          questaoId,
          favorita: false,
          paraRevisar: false,
          atualizadaEm: agora,
        };
        e.marcacoes[questaoId] = { ...atual, ...input, atualizadaEm: agora };
      });
      return estado.marcacoes[questaoId];
    });
  },

  async obterProficiencias() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      return calcularProficiencias(estado.tentativas.map(paraTentativaRegistrada)) satisfies Proficiencia[];
    });
  },

  async obterReforco() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      return calcularReforco(estado.tentativas.map(paraTentativaRegistrada)) satisfies Reforco;
    });
  },

  async obterRegularidade() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      const foguinho = calcularFoguinho(estado.diasComAtividade, estado.melhorFoguinho);
      const semana = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const chave = d.toISOString().slice(0, 10);
        const questoes = estado.tentativas.filter((t) => t.correcao.respondidaEm.slice(0, 10) === chave).length;
        return { data: chave, questoes };
      });
      const feito = semana.reduce((soma, dia) => soma + dia.questoes, 0);
      return {
        foguinho,
        semana,
        metaSemanal: { alvo: estado.preferencias.metaSemanal, feito },
      } satisfies Regularidade;
    });
  },

  async obterResumoGeral() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      const respondidas = estado.tentativas.length;
      const acertos = estado.tentativas.filter((t) => t.correcao.correta).length;
      const erros = respondidas - acertos;
      // Mesma janela de 7 dias (hoje incluso) que obterRegularidade usa pro WeekStrip.
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
      seteDiasAtras.setHours(0, 0, 0, 0);
      const respondidasSemana = estado.tentativas.filter(
        (t) => new Date(t.correcao.respondidaEm) >= seteDiasAtras,
      ).length;

      const porArea = (["LC", "CH", "CN", "MT"] as const).map((area) => {
        const tentativasDaArea = estado.tentativas.filter((t) => questaoPorId(t.questaoId)?.questao.area === area);
        const acertosDaArea = tentativasDaArea.filter((t) => t.correcao.correta).length;
        return {
          area,
          respondidas: tentativasDaArea.length,
          acertos: acertosDaArea,
          taxaAcerto: tentativasDaArea.length > 0 ? acertosDaArea / tentativasDaArea.length : null,
        };
      });

      return {
        respondidas,
        acertos,
        erros,
        taxaAcerto: respondidas > 0 ? acertos / respondidas : null,
        simuladosConcluidos: Object.values(estado.simulados).filter((s) => s.status === "finalizado").length,
        sessoesConcluidas: Object.values(estado.sessoes).filter((s) => s.sessao.encerradaEm !== null).length,
        respondidasSemana,
        porArea,
      } satisfies ResumoGeral;
    });
  },

  async listarAtividadesEmAndamento() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();

      const deSessoes: AtividadeEmAndamento[] = Object.values(estado.sessoes)
        .filter((s) => s.sessao.encerradaEm === null && s.sessao.respondidas < (s.sessao.total ?? Infinity))
        .map((s) => ({
          id: s.sessao.id,
          tipo: "sessao" as const,
          titulo: tituloDaSessao(s),
          area: s.pedido.areas?.length === 1 ? s.pedido.areas[0] : null,
          feitas: s.sessao.respondidas,
          total: s.sessao.total ?? s.sessao.respondidas,
          atualizadaEm: ultimaAtividadeEm(s, estado.tentativas),
        }));

      const deSimulados: AtividadeEmAndamento[] = Object.values(estado.simulados)
        .filter((s) => s.status === "em_andamento")
        .map((s) => {
          const respondidas = s.itens.filter((i) => i.resposta !== null).length;
          const areasUnicas = [...new Set(s.itens.map((i) => i.questao.area))];
          return {
            id: s.id,
            tipo: "simulado" as const,
            titulo: areasUnicas.length === 1 ? NOME_AREA[areasUnicas[0]] : "Simulado",
            area: areasUnicas.length === 1 ? areasUnicas[0] : null,
            feitas: respondidas,
            total: s.itens.length,
            atualizadaEm: s.iniciadoEm,
          };
        });

      return [...deSessoes, ...deSimulados]
        .sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm))
        .slice(0, 3);
    });
  },

  async listarSimulados() {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      return Object.values(estado.simulados)
        .map((s) => paraSimuladoResumo(s))
        .sort((a, b) => b.iniciadoEm.localeCompare(a.iniciadoEm));
    });
  },

  async criarSimulado(config: SimuladoConfig) {
    return comLatenciaECenario(() => {
      const id = proximoId("simulado");
      const areas: Area[] = config.areas.length > 0 ? config.areas : ["LC", "CH", "CN", "MT"];
      const candidatos = BANCO_DEMO.filter((q) => areas.includes(q.questao.area));
      if (candidatos.length < config.quantidade) {
        throw new ApiError(
          "validacao",
          `Só temos ${candidatos.length} questões de demonstração para essa combinação.`,
        );
      }
      const escolhidas = candidatos.slice(0, config.quantidade);
      const agora = new Date().toISOString();
      const limiteEm = config.duracaoMinutos
        ? new Date(Date.now() + config.duracaoMinutos * 60_000).toISOString()
        : null;

      const simulado: Simulado = {
        id,
        config,
        status: "em_andamento",
        iniciadoEm: agora,
        limiteEm,
        itens: escolhidas.map((q, i) => ({ n: i + 1, questao: q.questao, resposta: null, marcada: false })),
      };

      atualizarEstado((e) => {
        e.simulados[id] = simulado;
      });

      return simulado;
    });
  },

  async obterSimulado(id: string) {
    return comLatenciaECenario(() => {
      const simulado = lerEstado().simulados[id];
      if (!simulado) throw new ApiError("nao_encontrado", "Simulado não encontrado.");
      return simulado;
    });
  },

  async salvarRespostaSimulado(id: string, n: number, letra: Letra | null) {
    return comLatenciaECenario(() => {
      atualizarEstado((e) => {
        const simulado = e.simulados[id];
        const item = simulado?.itens.find((it) => it.n === n);
        if (item) item.resposta = letra;
      });
    });
  },

  async marcarRevisao(id: string, n: number, marcada: boolean) {
    return comLatenciaECenario(() => {
      atualizarEstado((e) => {
        const simulado = e.simulados[id];
        const item = simulado?.itens.find((it) => it.n === n);
        if (item) item.marcada = marcada;
      });
    });
  },

  async finalizarSimulado(id: string) {
    return comLatenciaECenario(() => {
      const estado = atualizarEstado((e) => {
        const simulado = e.simulados[id];
        if (!simulado) return;
        simulado.status = "finalizado";
        const agora = new Date().toISOString();
        for (const item of simulado.itens) {
          if (item.resposta === null) continue;
          const gabarito = letraCorreta(item.questao.id);
          if (!gabarito) continue;
          // id previsível (simulado-{id}-{n}): a tela de correção do simulado
          // (tela 12) precisa achar esta tentativa sem já ter o id gerado —
          // igual a tentativaId dentro de correcao, igual ao que enviarResposta faz.
          const tentativaId = `simulado-${id}-${item.n}`;
          e.tentativas.push({
            id: tentativaId,
            questaoId: item.questao.id,
            resposta: item.resposta,
            correcao: {
              tentativaId,
              correta: item.resposta === gabarito,
              gabarito,
              resolucao: questaoPorId(item.questao.id)?.resolucao ?? null,
              respondidaEm: agora,
            },
            modo: "simulado",
            versaoModelo: MODELO_MOCK.versao,
            sessaoId: null,
          });
        }
      });
      registrarAtividadeHoje();
      const simulado = estado.simulados[id];
      if (!simulado) throw new ApiError("nao_encontrado", "Simulado não encontrado.");
      return montarResultadoSimulado(simulado, estado.tentativas.map(paraTentativaRegistrada));
    });
  },

  async obterResultadoSimulado(id: string) {
    return comLatenciaECenario(() => {
      const estado = lerEstado();
      const simulado = estado.simulados[id];
      if (!simulado) throw new ApiError("nao_encontrado", "Simulado não encontrado.");
      if (simulado.status !== "finalizado") {
        throw new ApiError("validacao", "Este simulado ainda não foi finalizado.");
      }
      return montarResultadoSimulado(simulado, estado.tentativas.map(paraTentativaRegistrada));
    });
  },
};

function montarResumoSessao(interna: SessaoInterna): ResumoSessao {
  const estado = lerEstado();
  const foguinho = calcularFoguinho(estado.diasComAtividade, estado.melhorFoguinho);
  const proficiencias = calcularProficiencias(estado.tentativas.map(paraTentativaRegistrada));

  const porHabilidadeMap = new Map<string, { habilidade: Habilidade | null; acertos: number; total: number }>();
  for (const item of interna.itensResumo) {
    const chave = item.habilidade ?? "sem-habilidade";
    const atual = porHabilidadeMap.get(chave) ?? {
      habilidade: item.habilidade ? questaoPorId(item.questaoId)?.questao.habilidade ?? null : null,
      acertos: 0,
      total: 0,
    };
    atual.total += 1;
    if (item.correta) atual.acertos += 1;
    porHabilidadeMap.set(chave, atual);
  }

  const respondidasIds = interna.itensResumo.map((it) => it.questaoId);
  const { itens: sugestaoProxima } = gerarRecomendacoes(
    { modo: interna.sessao.modo === "progressao" ? "progressao" : "tema", areas: interna.pedido.areas, quantidade: 1 },
    { tentativas: estado.tentativas.map(paraTentativaRegistrada), idsRespondidasNestaSessao: respondidasIds },
  );

  return {
    sessao: interna.sessao,
    itens: interna.itensResumo,
    porHabilidade: [...porHabilidadeMap.values()],
    foguinho,
    proficiencias,
    proxima: sugestaoProxima[0] ?? null,
  };
}

function paraSimuladoResumo(s: Simulado): SimuladoResumo {
  const respondidas = s.itens.filter((i) => i.resposta !== null).length;
  const acertos =
    s.status === "finalizado"
      ? s.itens.filter((i) => i.resposta !== null && i.resposta === letraCorreta(i.questao.id)).length
      : null;
  const duracaoSegundos =
    s.status === "finalizado" ? Math.round((Date.now() - new Date(s.iniciadoEm).getTime()) / 1000) : null;

  const rotulo =
    s.config.escopo === "area"
      ? `Área (${s.config.areas.join(", ")})`
      : s.config.escopo === "dia"
        ? "Dia completo"
        : "Personalizado";

  return {
    id: s.id,
    status: s.status,
    rotulo,
    iniciadoEm: s.iniciadoEm,
    limiteEm: s.limiteEm,
    total: s.itens.length,
    respondidas,
    acertos,
    duracaoSegundos,
  };
}

function montarResultadoSimulado(simulado: Simulado, tentativas: TentativaRegistrada[]): ResultadoSimulado {
  const itens = simulado.itens.map((item) => {
    const gabarito = letraCorreta(item.questao.id) ?? "A";
    return {
      n: item.n,
      questaoId: item.questao.id,
      area: item.questao.area,
      habilidade: item.questao.habilidade?.codigo ?? null,
      resposta: item.resposta,
      gabarito,
      correta: item.resposta !== null && item.resposta === gabarito,
      marcada: item.marcada,
    };
  });

  const acertos = itens.filter((i) => i.correta).length;
  const emBranco = itens.filter((i) => i.resposta === null).length;
  const duracaoSegundos = Math.max(
    0,
    Math.round((Date.now() - new Date(simulado.iniciadoEm).getTime()) / 1000),
  );

  const areas = [...new Set(itens.map((i) => i.area))];
  const porArea = areas.map((area) => {
    const doArea = itens.filter((i) => i.area === area);
    return { area, acertos: doArea.filter((i) => i.correta).length, total: doArea.length };
  });

  const porHabilidadeErrada = new Map<string, { area: Area; acertos: number; total: number }>();
  for (const item of itens) {
    if (!item.habilidade) continue;
    const atual = porHabilidadeErrada.get(item.habilidade) ?? { area: item.area, acertos: 0, total: 0 };
    atual.total += 1;
    if (item.correta) atual.acertos += 1;
    porHabilidadeErrada.set(item.habilidade, atual);
  }
  const habilidadesFracas = [...porHabilidadeErrada.entries()]
    .filter(([, v]) => v.total > 0 && v.acertos / v.total < 0.5)
    .map(([codigo, v]) => ({
      area: v.area,
      habilidade: questaoPorId(itens.find((i) => i.habilidade === codigo)?.questaoId ?? "")?.questao.habilidade ?? {
        codigo,
        descricao: null,
      },
      acertos: v.acertos,
      total: v.total,
    }));

  return {
    simuladoId: simulado.id,
    acertos,
    total: itens.length,
    emBranco,
    duracaoSegundos,
    porArea,
    itens,
    habilidadesFracas,
    proficiencias: calcularProficiencias(tentativas),
  };
}
