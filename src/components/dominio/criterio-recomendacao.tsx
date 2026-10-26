import { Sparkles } from "lucide-react";
import type { Criterio } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { Disclosure } from "@/components/ui/disclosure";

export interface CriterioRecomendacaoProps {
  criterio: Criterio;
  versaoModelo?: string;
  className?: string;
}

/**
 * Nota de margem em âmbar — a ÚNICA cor exclusiva de "decidido por IA" (seção 2, regra 9).
 * O texto do critério vem da API; nunca é montado aqui com dado que não veio dela (regra 6).
 */
export function CriterioRecomendacao({ criterio, versaoModelo, className }: CriterioRecomendacaoProps) {
  return (
    <div className={cn("rounded-r-xs border-l-[3px] border-l-amber bg-amber-soft p-4", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-ink">
        <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        Recomendado pelo modelo
      </p>
      <p className="mt-1.5 text-sm text-ink">{criterio.texto}</p>
      {versaoModelo ? (
        <Disclosure titulo={<span className="text-xs text-ink-2">Detalhes</span>} className="mt-1 border-t-0">
          <p className="text-xs text-ink-2">Versão do modelo: {versaoModelo}</p>
        </Disclosure>
      ) : null}
    </div>
  );
}
