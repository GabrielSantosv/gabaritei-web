"use client";

import { useEffect, useState } from "react";
import { formatarCronometro } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface TimerProps {
  segundosRestantes: number;
  onZero?: () => void;
  onAvisoMinutos?: (minutos: 30 | 10 | 5 | 1) => void;
  className?: string;
}

const AVISOS: (30 | 10 | 5 | 1)[] = [30, 10, 5, 1];

/** role="timer", mono, aria-live desligado. Avisos só em 30/10/5/1 min (seção 9). */
export function Timer({ segundosRestantes, onZero, onAvisoMinutos, className }: TimerProps) {
  const [restante, setRestante] = useState(segundosRestantes);
  const [avisados, setAvisados] = useState<Set<number>>(() => new Set());

  // Ajuste durante a renderização (react.dev "Adjusting state when a prop
  // changes"), em vez de um efeito, quando uma nova contagem é iniciada com
  // um valor diferente de segundosRestantes.
  const [segundosRestantesAnterior, setSegundosRestantesAnterior] = useState(segundosRestantes);
  if (segundosRestantes !== segundosRestantesAnterior) {
    setSegundosRestantesAnterior(segundosRestantes);
    setRestante(segundosRestantes);
    setAvisados(new Set());
  }

  useEffect(() => {
    if (restante <= 0) {
      onZero?.();
      return;
    }
    const id = setTimeout(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [restante, onZero]);

  useEffect(() => {
    const minutoAtual = Math.ceil(restante / 60);
    const marco = AVISOS.find((m) => m === minutoAtual);
    if (marco && !avisados.has(marco)) {
      // setAvisados aqui só evita notificar o mesmo marco duas vezes; o efeito
      // em si é a notificação externa (onAvisoMinutos), que não pode rodar
      // durante a renderização.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvisados((atual) => new Set(atual).add(marco));
      onAvisoMinutos?.(marco);
    }
  }, [restante, avisados, onAvisoMinutos]);

  return (
    <span role="timer" aria-live="off" className={cn("font-mono text-sm tabular-nums text-ink", className)}>
      {formatarCronometro(restante)}
    </span>
  );
}
