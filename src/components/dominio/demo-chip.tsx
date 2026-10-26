import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DemoChipProps {
  className?: string;
}

/**
 * Selo "Demonstração" em cada questão (etapa V, item 7): o aviso de dados
 * fictícios (seção 2, regra 8) sai do meio do enunciado e vira este chip, mais
 * a faixa global discreta (`DemoBanner`) — nunca removido, só menos ruidoso.
 */
export function DemoChip({ className }: DemoChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2",
        className,
      )}
    >
      <Info className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      Demonstração
    </span>
  );
}
