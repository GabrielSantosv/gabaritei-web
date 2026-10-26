import { cn } from "@/lib/cn";

export interface AnelProgressoProps {
  valor: number;
  total: number;
  rotulo: string;
  className?: string;
}

/**
 * Anel de SVG com o número no centro (P2, Início, "meta da semana" na faixa
 * principal). Usa `currentColor` pro traço preenchido: dentro da faixa colorida
 * herda o mesmo texto já escolhido pelo tema (claro/escuro, seção 4.3), sem
 * token novo. O trilho de fundo usa a mesma cor a 25% de opacidade.
 */
export function AnelProgresso({ valor, total, rotulo, className }: AnelProgressoProps) {
  const percentual = total > 0 ? Math.min(100, Math.max(0, (valor / total) * 100)) : 0;
  const raio = 26;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = (percentual / 100) * circunferencia;

  return (
    <div
      role="img"
      aria-label={`${rotulo}: ${valor} de ${total}`}
      className={cn("relative inline-flex size-16 items-center justify-center", className)}
    >
      <svg viewBox="0 0 60 60" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="30" cy="30" r={raio} fill="none" stroke="currentColor" strokeWidth="5" opacity="0.25" />
        <circle
          cx="30"
          cy="30"
          r={raio}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia - preenchido}
        />
      </svg>
      <span className="absolute font-display text-base tabular-nums">{Math.round(percentual)}%</span>
    </div>
  );
}
