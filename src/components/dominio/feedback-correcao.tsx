import { Check, X } from "lucide-react";
import type { Correcao } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export interface FeedbackCorrecaoProps {
  correcao: Correcao;
  className?: string;
}

/** Resolução ausente nunca é inventada (regra 4, RF07). */
export function FeedbackCorrecao({ correcao, className }: FeedbackCorrecaoProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-r-xs border-l-[3px] p-4",
        correcao.correta ? "border-l-brand bg-brand-soft" : "border-l-err bg-err-soft",
        className,
      )}
    >
      <p className={cn("flex items-center gap-2 font-medium", correcao.correta ? "text-brand-ink" : "text-err")}>
        {correcao.correta ? (
          <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
        )}
        {correcao.correta ? "Você acertou" : "Você errou"}
      </p>
      <p className="mt-1 text-sm text-ink">
        Gabarito oficial: <strong className="font-mono">{correcao.gabarito}</strong>
      </p>
      <div className="mt-3 border-t border-rule pt-3">
        <p className="text-sm font-medium text-ink">Resolução</p>
        <p className="mt-1 text-sm text-ink-2">
          {correcao.resolucao ?? "Resolução ainda não cadastrada para esta questão."}
        </p>
      </div>
    </div>
  );
}
