/**
 * O grupo (foco) não impõe casca compartilhada: cada página (treino em
 * sessão, simulado em andamento) usa <FocusShell> diretamente, porque título,
 * progresso e a mensagem de saída mudam por tela (seção 8).
 */
export default function FocoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
