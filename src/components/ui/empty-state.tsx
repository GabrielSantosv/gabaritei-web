import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icone?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}

/** Vazio como convite para agir (seção 6), nunca como pedido de desculpas. */
export function EmptyState({ icone: Icone, titulo, descricao, acao, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-md bg-paper-2 p-6", className)}>
      {Icone ? <Icone className="size-6 text-ink-2" strokeWidth={1.75} aria-hidden="true" /> : null}
      <div>
        <p className="font-medium text-ink">{titulo}</p>
        {descricao ? <p className="mt-1 text-sm text-ink-2">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
