"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export interface DisclosureProps {
  titulo: React.ReactNode;
  children: React.ReactNode;
  abertoPorPadrao?: boolean;
  className?: string;
}

/** aria-expanded + aria-controls (seção 9). Usado em "Detalhes técnicos" e nos passos do plano. */
export function Disclosure({ titulo, children, abertoPorPadrao = false, className }: DisclosureProps) {
  const [aberto, setAberto] = useState(abertoPorPadrao);
  const idConteudo = useId();

  return (
    <div className={cn("border-t border-rule", className)}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idConteudo}
        onClick={() => setAberto((a) => !a)}
        className="flex min-h-12 w-full items-center justify-between gap-2 py-3 text-left text-sm font-medium text-ink"
      >
        {titulo}
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-2 motion-safe-transition", aberto && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      {aberto ? (
        <div id={idConteudo} className="pb-4 text-sm text-ink-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
