/**
 * Persistência do servidor falso em localStorage (seção 7.3). Tudo aqui é
 * envolvido em try/catch: em modo privado ou com storage bloqueado, o mock
 * ainda funciona (só não lembra nada entre recarregamentos).
 */
import type {
  Marcacao,
  ParamsSessao,
  Perfil,
  Preferencias,
  Recomendacao,
  ResumoSessao,
  Sessao,
  Simulado,
  Tentativa,
} from "../types";

const CHAVE = "gabaritei:mock:v1";
const CHAVE_SESSAO_AUTH = "gabaritei:mock:sessao";

export interface SessaoInterna {
  sessao: Sessao;
  fila: Recomendacao[];
  respondidasIds: string[];
  itensResumo: ResumoSessao["itens"];
  /** Pedido original (seção 7.1, ParamsSessao): usado no modo progressão pra
   *  gerar "proxima" respeitando as mesmas áreas/habilidade da sessão
   *  inteira, não só a faixa do Combo. */
  pedido: ParamsSessao;
}

export interface EstadoMock {
  perfil: Perfil | null;
  preferencias: Preferencias;
  tentativas: Tentativa[];
  sessoes: Record<string, SessaoInterna>;
  simulados: Record<string, Simulado>;
  diasComAtividade: string[];
  melhorFoguinho: number;
  contadorId: number;
  /** Favoritar/marcar pra revisar (por questão — canvas de Histórico). */
  marcacoes: Record<string, Marcacao>;
}

const PREFERENCIAS_PADRAO: Preferencias = {
  tema: "sistema",
  paleta: "floresta",
  reduzirMovimento: "sistema",
  tamanhoTexto: 100,
  descricaoImagensAberta: false,
  atalhosTeclado: true,
  metaSemanal: 50,
};

function estadoPadrao(): EstadoMock {
  return {
    perfil: null,
    preferencias: PREFERENCIAS_PADRAO,
    tentativas: [],
    sessoes: {},
    simulados: {},
    diasComAtividade: [],
    melhorFoguinho: 0,
    contadorId: 1,
    marcacoes: {},
  };
}

function storageDisponivel(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function lerEstado(): EstadoMock {
  if (!storageDisponivel()) return estadoPadrao();
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return estadoPadrao();
    const salvo = JSON.parse(bruto) as Partial<EstadoMock>;
    const padrao = estadoPadrao();
    // Mescla preferencias um nível mais fundo: um localStorage salvo antes de um
    // campo novo ser acrescentado (ex.: paleta/reduzirMovimento/tamanhoTexto na
    // paridade) não pode fazer esse campo voltar undefined — {...padrao, ...salvo}
    // sozinho substituiria o objeto preferencias inteiro pelo antigo, incompleto.
    return { ...padrao, ...salvo, preferencias: { ...padrao.preferencias, ...salvo.preferencias } };
  } catch {
    return estadoPadrao();
  }
}

export function salvarEstado(estado: EstadoMock): void {
  if (!storageDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // modo privado ou storage cheio: segue sem persistir
  }
}

export function atualizarEstado(mutar: (estado: EstadoMock) => void): EstadoMock {
  const estado = lerEstado();
  mutar(estado);
  salvarEstado(estado);
  return estado;
}

export function proximoId(prefixo: string): string {
  const estado = lerEstado();
  const id = `${prefixo}-${estado.contadorId}`;
  atualizarEstado((e) => {
    e.contadorId = estado.contadorId + 1;
  });
  return id;
}

/** Sessão falsa de autenticação. O doc pede "cookie"; aqui é um cookie de verdade,
 *  simples, só com um marcador — os dados do usuário ficam no localStorage acima. */
export function definirSessaoAutenticada(ativa: boolean): void {
  if (typeof document === "undefined") return;
  try {
    if (ativa) {
      document.cookie = `${CHAVE_SESSAO_AUTH}=1; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      document.cookie = `${CHAVE_SESSAO_AUTH}=; path=/; max-age=0`;
    }
  } catch {
    // ignora: sem cookies, trata como deslogado
  }
}

export function temSessaoAutenticada(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie.split("; ").some((c) => c.startsWith(`${CHAVE_SESSAO_AUTH}=1`));
  } catch {
    return false;
  }
}

export function limparTudo(): void {
  if (!storageDisponivel()) return;
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
  definirSessaoAutenticada(false);
}
