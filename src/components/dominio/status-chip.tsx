import { Check, Circle, Flag, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatusChipValor = "acertou" | "errou" | "em_branco" | "nao_respondida" | "marcada";

const CONFIG: Record<StatusChipValor, { rotulo: string; icone: typeof Check; classe: string }> = {
  acertou: { rotulo: "Acertou", icone: Check, classe: "bg-brand-soft text-brand-ink" },
  errou: { rotulo: "Errou", icone: X, classe: "bg-err-soft text-err" },
  em_branco: { rotulo: "Em branco", icone: Minus, classe: "bg-paper-2 text-ink-2" },
  nao_respondida: { rotulo: "Não respondida", icone: Circle, classe: "bg-paper-2 text-ink-2" },
  // Nunca âmbar aqui: âmbar é exclusivo de "decidido por IA" (seção 2, regra 9).
  marcada: { rotulo: "Marcada para revisar", icone: Flag, classe: "bg-paper-2 text-ink" },
};

export interface StatusChipProps {
  status: StatusChipValor;
  className?: string;
}

/** Selo (pílula com fundo), não só texto colorido — mesma régua de contraste
 *  já usada em AreaTag/FaixaChip, pra não virar uma cor isolada perdida na
 *  linha (canvas Telas.dc.html, Questões e Histórico). */
export function StatusChip({ status, className }: StatusChipProps) {
  const { rotulo, icone: Icone, classe } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        classe,
        className,
      )}
    >
      <Icone className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {rotulo}
    </span>
  );
}
