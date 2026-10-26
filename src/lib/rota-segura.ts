/**
 * Valida `?proxima=` (seção 10.1, tela 1): só aceita caminhos internos, nunca
 * uma URL de outro domínio (evita open redirect).
 */
export function caminhoInternoSeguro(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  if (valor.includes("://")) return null;
  return valor;
}

/** Depois de entrar ou criar conta (P2): quem não terminou os primeiros passos
 *  vai pra lá sempre, mesmo com um `?proxima=` pedindo outra rota — o fim dos
 *  primeiros passos sempre leva a /inicio (ou ao diagnóstico), nunca de volta
 *  pra `proxima` (seção 8, P2: só duas saídas fixas). */
export function destinoPosEntrada(onboardingConcluido: boolean, proxima?: string | null): string {
  if (!onboardingConcluido) return "/boas-vindas";
  return caminhoInternoSeguro(proxima) ?? "/inicio";
}
