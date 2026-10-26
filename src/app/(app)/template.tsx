/** Transição de página (docs/FRONTEND_PARIDADE.md, 4.4): só opacidade, remonta a
 *  cada navegação (ao contrário de layout.tsx). Nunca em (foco). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina-in">{children}</div>;
}
