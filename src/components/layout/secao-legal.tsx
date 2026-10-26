export interface SecaoLegalProps {
  titulo: string;
  id: string;
}

/** Seção provisória de Termos/Privacidade (tela 14): só a estrutura, o texto é do grupo. */
export function SecaoLegal({ titulo, id }: SecaoLegalProps) {
  return (
    <section id={id} className="border-t border-rule py-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg text-ink">{titulo}</h2>
      <p className="mt-2 font-mono text-sm text-ink-2">TODO(equipe): texto jurídico.</p>
    </section>
  );
}
