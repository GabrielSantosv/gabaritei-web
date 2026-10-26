import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RemovableChipProps {
  children: React.ReactNode;
  onRemover: () => void;
  rotulo: string;
  className?: string;
}

/**
 * Chip de filtro ativo, removível (seção 10.3, tela 7). O chip inteiro é o
 * alvo de toque (min-h-12, seção 2 regra 10) — o X é só o indicador visual.
 */
export function RemovableChip({ children, onRemover, rotulo, className }: RemovableChipProps) {
  return (
    <button
      type="button"
      onClick={onRemover}
      aria-label={`Tirar filtro: ${rotulo}`}
      className={cn(
        "inline-flex min-h-12 items-center gap-1.5 rounded-full border border-rule-strong bg-card pl-3 pr-2.5 text-sm text-ink",
        "hover:bg-paper-2",
        className,
      )}
    >
      {children}
      <X className="size-3.5 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
