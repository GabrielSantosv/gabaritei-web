/**
 * Lembrete client-side de qual sessão de treino está em andamento (tela 3,
 * bloco "Retomar"). O contrato (seção 7.2) não tem uma função
 * "sessão em andamento" — só `obterSessao(id)`, que precisa de um id. Por
 * isso guardamos o último id aqui (fora da Api) e confirmamos o status de
 * verdade com `obterSessao` antes de mostrar o bloco.
 * TODO(equipe): ver docs/PENDENCIAS.md — considerar um endpoint de verdade.
 */
const CHAVE = "gabaritei:sessao-ativa";

export function salvarSessaoAtivaId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, id);
  } catch {
    // modo privado ou storage bloqueado: sem "retomar" nesta aba, sem quebrar o resto
  }
}

export function lerSessaoAtivaId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function limparSessaoAtivaId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
}

const PREFIXO_FILA = "gabaritei:fila-sessao:";

export function salvarFilaSessao(sessaoId: string, fila: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${PREFIXO_FILA}${sessaoId}`, JSON.stringify(fila));
  } catch {
    // ignora
  }
}

export function lerFilaSessao<T>(sessaoId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.sessionStorage.getItem(`${PREFIXO_FILA}${sessaoId}`);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function limparFilaSessao(sessaoId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(`${PREFIXO_FILA}${sessaoId}`);
  } catch {
    // ignora
  }
}
