import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NotaNeutraProps {
  texto: string;
  className?: string;
  // "nota" (padrão): caixa com borda à esquerda, pra explicar um critério.
  // "rotulo" (Início novo, cartão "Seu próximo passo"): pílula pequena, pro
  // rótulo no topo do cartão — par do rótulo âmbar de CriterioRecomendacao.
  variante?: "nota" | "rotulo";
}

/**
 * Par de CriterioRecomendacao (regra 9: âmbar exclusivo de IA de verdade) —
 * mesma função (explicar o critério de uma recomendação), sem o selo de IA,
 * pra quando a escolha veio de uma regra simples, não de `modelo` (P2: "Deixar
 * o modelo escolher" sem reforço suficiente cai aqui).
 */
export function NotaNeutra({ texto, className, variante = "nota" }: NotaNeutraProps) {
  if (variante === "rotulo") {
    return (
      <span
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 self-start rounded-sm border border-rule bg-paper-2 px-3 text-sm font-semibold text-ink-2",
          className,
        )}
      >
        {texto}
      </span>
    );
  }

  return (
    <div className={cn("flex items-start gap-2 rounded-r-xs border-l-[3px] border-l-rule-strong bg-paper-2 p-4", className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm text-ink">{texto}</p>
    </div>
  );
}
