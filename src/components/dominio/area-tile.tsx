"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { BookOpen, Calculator, Landmark, Leaf } from "lucide-react";
import type { Area } from "@/lib/api/types";
import { cn } from "@/lib/cn";

// Classes escritas por extenso (não compostas em runtime): o scanner estático do
// Tailwind v4 precisa ver a string literal pra gerar o CSS de cada variante.
const CONFIG: Record<
  Area,
  { nome: string; Icone: typeof BookOpen; fundo: string; texto: string; selecionado: string }
> = {
  LC: {
    nome: "Linguagens",
    Icone: BookOpen,
    fundo: "bg-area-lc-soft",
    texto: "text-area-lc",
    selecionado: "data-[state=checked]:border-area-lc",
  },
  CH: {
    nome: "Ciências Humanas",
    Icone: Landmark,
    fundo: "bg-area-ch-soft",
    texto: "text-area-ch",
    selecionado: "data-[state=checked]:border-area-ch",
  },
  CN: {
    nome: "Ciências da Natureza",
    Icone: Leaf,
    fundo: "bg-area-cn-soft",
    texto: "text-area-cn",
    selecionado: "data-[state=checked]:border-area-cn",
  },
  MT: {
    nome: "Matemática",
    Icone: Calculator,
    fundo: "bg-area-mt-soft",
    texto: "text-area-mt",
    selecionado: "data-[state=checked]:border-area-mt",
  },
};

export interface AreaTileProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "children"> {
  area: Area;
  className?: string;
}

/**
 * Ladrilho de área (etapa V, item 2): AMPLIA a regra de que `--area-*` só vale em
 * `AreaTag`/filetes finos (seção 6) — autorizado nesta etapa, registrado como
 * `TODO(equipe)` em PENDENCIAS.md pro grupo ratificar.
 *
 * Controle selecionável de verdade (checkbox com rótulo), nunca `div` com clique; o
 * estado selecionado soma borda + ícone de check, nunca só cor (seção 2, regra 6).
 * Alvo de toque ≥ 48px.
 */
export function AreaTile({ area, className, ...props }: AreaTileProps) {
  const { nome, Icone, fundo, texto, selecionado } = CONFIG[area];
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "group relative flex min-h-24 flex-col items-start gap-2 rounded-md border-2 border-transparent p-4 text-left",
        fundo,
        "data-[state=checked]:bg-card",
        selecionado,
        "motion-safe-transition",
        className,
      )}
      {...props}
    >
      <Icone className={cn("size-6", texto)} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex items-center gap-1">
        <span className={cn("font-mono text-xs", texto)}>{area}</span>
        <span className="text-sm font-medium text-ink">{nome}</span>
      </span>
      <CheckboxPrimitive.Indicator asChild>
        <span className={cn("absolute right-3 top-3 flex size-5 items-center justify-center rounded-full", "bg-card", texto)}>
          <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true">
            <path d="M6.2 11.3 2.9 8l1.1-1.1 2.2 2.2 5.8-5.8L13.1 4.4z" />
          </svg>
        </span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
