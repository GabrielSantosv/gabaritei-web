"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPaginaChange: (pagina: number) => void;
  className?: string;
}

export function Pagination({ paginaAtual, totalPaginas, onPaginaChange, className }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1,
  );

  return (
    <nav aria-label="Paginação" className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label="Página anterior"
        disabled={paginaAtual <= 1}
        onClick={() => onPaginaChange(paginaAtual - 1)}
        className="flex size-12 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-2 disabled:opacity-40"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {paginas.map((pagina, i) => {
        const anterior = paginas[i - 1];
        const mostrarReticencias = anterior !== undefined && pagina - anterior > 1;
        return (
          <span key={pagina} className="flex items-center gap-1">
            {mostrarReticencias ? <span className="px-1 text-ink-2">…</span> : null}
            <button
              type="button"
              aria-current={pagina === paginaAtual ? "page" : undefined}
              onClick={() => onPaginaChange(pagina)}
              className={cn(
                "flex size-12 items-center justify-center rounded-sm text-sm font-medium text-ink-2 hover:bg-paper-2",
                pagina === paginaAtual && "bg-brand text-on-brand hover:bg-brand",
              )}
            >
              {pagina}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        aria-label="Próxima página"
        disabled={paginaAtual >= totalPaginas}
        onClick={() => onPaginaChange(paginaAtual + 1)}
        className="flex size-12 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-2 disabled:opacity-40"
      >
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </nav>
  );
}
