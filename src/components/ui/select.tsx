"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  valor: string;
  rotulo: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  rotulo: string;
  opcoes: SelectOption[];
}

/** `<select>` nativo com rótulo visível (mesmo visual de Field) — filtros do Histórico e afins. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { rotulo, opcoes, id, className, ...props },
  ref,
) {
  const idGerado = useId();
  const selectId = id ?? idGerado;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {rotulo}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "min-h-12 w-full appearance-none rounded-sm border border-rule-strong bg-card pl-3 pr-10 text-base text-ink",
            className,
          )}
          {...props}
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-2"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
