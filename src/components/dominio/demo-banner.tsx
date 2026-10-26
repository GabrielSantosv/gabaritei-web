import { Info } from "lucide-react";

/**
 * Fixo no topo enquanto API_MODE=mock (seção 7.3, regra 8 da seção 2). Mais discreta
 * desde a etapa V (item 7): o grosso do aviso por questão já vem do `DemoChip`, então
 * esta faixa só reforça o aviso global, com menos peso visual (nunca removida).
 */
export function DemoBanner() {
  return (
    <div
      role="region"
      aria-label="Aviso de dados de demonstração"
      className="flex items-center justify-center gap-1.5 bg-paper-2 px-4 py-1.5 text-xs text-ink-2"
    >
      <Info className="size-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      Dados de demonstração: nenhuma informação aqui vem de uma prova real.
    </div>
  );
}
