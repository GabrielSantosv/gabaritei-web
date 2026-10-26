import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  valor: number;
  total: number;
  rotulo: string;
  mostrarNumero?: boolean;
  className?: string;
}

/** Sempre com número ao lado (seção 9): a cor da barra nunca é a única informação. */
export function ProgressBar({ valor, total, rotulo, mostrarNumero = true, className }: ProgressBarProps) {
  const percentual = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2"
      >
        <div className="h-full rounded-full bg-brand motion-safe-transition" style={{ width: `${percentual}%` }} />
      </div>
      {mostrarNumero ? (
        <span className="shrink-0 text-sm tabular-nums text-ink-2">
          {valor} de {total}
        </span>
      ) : null}
    </div>
  );
}
