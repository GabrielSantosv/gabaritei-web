import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NotaNeutraProps {
  texto: string;
  className?: string;
}

/**
 * Par de CriterioRecomendacao (regra 9: âmbar exclusivo de IA de verdade) —
 * mesma função (explicar o critério de uma recomendação), sem o selo de IA,
 * pra quando a escolha veio de uma regra simples, não de `modelo` (P2: "Deixar
 * o modelo escolher" sem reforço suficiente cai aqui).
 */
export function NotaNeutra({ texto, className }: NotaNeutraProps) {
  return (
    <div className={cn("flex items-start gap-2 rounded-r-xs border-l-[3px] border-l-rule-strong bg-paper-2 p-4", className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm text-ink">{texto}</p>
    </div>
  );
}
