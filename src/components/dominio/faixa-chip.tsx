import { BarChart, BarChart2, BarChart3 } from "lucide-react";
import type { Faixa } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const CONFIG: Record<Faixa, { rotulo: string; Icone: typeof BarChart }> = {
  facil: { rotulo: "Fácil", Icone: BarChart },
  media: { rotulo: "Média", Icone: BarChart2 },
  dificil: { rotulo: "Difícil", Icone: BarChart3 },
};

export interface FaixaChipProps {
  faixa: Faixa | null;
  className?: string;
}

/** Ícone de barras + texto, em --ink-2. Não usa cor de área nem âmbar (seção 6). */
export function FaixaChip({ faixa, className }: FaixaChipProps) {
  if (!faixa) {
    return <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-2", className)}>Dificuldade não informada</span>;
  }
  const { rotulo, Icone } = CONFIG[faixa];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-2", className)}>
      <Icone className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {rotulo}
    </span>
  );
}
