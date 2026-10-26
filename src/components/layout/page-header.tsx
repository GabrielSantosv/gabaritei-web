export interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
}

/** Um único h1 por página (seção 8); o foco vai para ele a cada troca de rota (ver FocoNoH1). */
export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 tabIndex={-1} className="text-2xl text-ink">
          {titulo}
        </h1>
        {descricao ? <p className="mt-1 text-ink-2">{descricao}</p> : null}
      </div>
      {acoes}
    </div>
  );
}
