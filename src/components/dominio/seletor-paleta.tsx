"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { NOME_PALETA, paletasPermitidas } from "@/lib/paletas";
import type { PaletaId } from "@/lib/api/types";
import paletasJson from "@/styles/paletas.json";

type CoresPaleta = { brand: string; accent: string; paper: string };
const PALETAS_CORES = paletasJson as Record<PaletaId, { light: CoresPaleta; dark: CoresPaleta }>;

export interface SeletorPaletaProps {
  valor: PaletaId;
  temaResolvido: "light" | "dark";
  onValorChange: (p: PaletaId) => void;
}

/** Radiogroup com amostras (P1, Configuracoes; reusado na P2, Primeiros passos):
 *  as 3 cores vêm de paletas.json pelo id da paleta da OPÇÃO, não da paleta
 *  ativa no `<html>` — html[data-palette] só existe mesmo pra paleta
 *  selecionada, não dá pra usar os tokens CSS pra pré-visualizar as outras. */
export function SeletorPaleta({ valor, temaResolvido, onValorChange }: SeletorPaletaProps) {
  return (
    <RadioGroupPrimitive.Root
      value={valor}
      onValueChange={(v) => onValorChange(v as PaletaId)}
      aria-label="Paleta"
      className="flex flex-wrap gap-3"
    >
      {paletasPermitidas().map((id) => {
        const cores = PALETAS_CORES[id][temaResolvido];
        return (
          <RadioGroupPrimitive.Item
            key={id}
            value={id}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-sm border-2 border-transparent bg-card px-3",
              "data-[state=checked]:border-brand",
              "motion-safe-transition",
            )}
          >
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="size-5 rounded-full border border-rule-strong" style={{ backgroundColor: cores.brand }} />
              <span className="size-5 rounded-full border border-rule-strong" style={{ backgroundColor: cores.accent }} />
              <span className="size-5 rounded-full border border-rule-strong" style={{ backgroundColor: cores.paper }} />
            </span>
            <span className="text-sm font-medium text-ink">{NOME_PALETA[id]}</span>
            <RadioGroupPrimitive.Indicator asChild>
              <Check className="size-4 text-brand-ink" strokeWidth={1.75} aria-hidden="true" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
