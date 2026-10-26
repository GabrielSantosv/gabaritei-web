"use client";

import { cn } from "@/lib/cn";

export interface SegmentedOpcao<T extends string> {
  valor: T;
  rotulo: string;
}

export interface SegmentedProps<T extends string> {
  rotulo: string;
  opcoes: SegmentedOpcao<T>[];
  valor: T;
  onValorChange: (valor: T) => void;
  className?: string;
}

/** Grupo de opções exclusivas em linha (ex.: quantidade de questões, tema claro/escuro). */
export function Segmented<T extends string>({
  rotulo,
  opcoes,
  valor,
  onValorChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cn("inline-flex rounded-sm border border-rule-strong bg-card p-1", className)}
    >
      {opcoes.map((opcao) => {
        const selecionada = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={selecionada}
            onClick={() => onValorChange(opcao.valor)}
            className={cn(
              "min-h-9 min-w-11 rounded-xs px-3 text-sm font-medium text-ink-2",
              "motion-safe-transition",
              selecionada && "bg-brand text-on-brand",
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
