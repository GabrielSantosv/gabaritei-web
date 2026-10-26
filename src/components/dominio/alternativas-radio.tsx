"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check, X } from "lucide-react";
import type { Bloco, Letra, Questao } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export interface AlternativasRadioProps {
  alternativas: Questao["alternativas"];
  respostaMarcada: Letra | null;
  onRespostaChange?: (letra: Letra) => void;
  gabarito?: Letra | null;
  interativo: boolean;
  className?: string;
}

function textoBlocos(blocos: Bloco[]): React.ReactNode {
  return blocos.map((b, i) => (b.tipo === "texto" || b.tipo === "citacao" ? <span key={i}>{b.texto}</span> : null));
}

function rotuloEstado(letra: Letra, marcada: boolean, gabarito: Letra | null | undefined): string {
  if (gabarito === undefined) return `Alternativa ${letra}${marcada ? ", selecionada" : ""}`;
  if (gabarito === null) return `Alternativa ${letra}${marcada ? ", selecionada" : ""}`;
  const correta = letra === gabarito;
  if (marcada && correta) return `Alternativa ${letra}, sua resposta, correta`;
  if (marcada && !correta) return `Alternativa ${letra}, sua resposta, incorreta`;
  if (!marcada && correta) return `Alternativa ${letra}, gabarito oficial`;
  return `Alternativa ${letra}`;
}

/** Grupo de rádio de verdade. Estados visuais da tabela da seção 6 (nunca só cor). */
export function AlternativasRadio({
  alternativas,
  respostaMarcada,
  onRespostaChange,
  gabarito,
  interativo,
  className,
}: AlternativasRadioProps) {
  const itens = alternativas.map((alt) => {
    const marcada = respostaMarcada === alt.letra;
    const correta = gabarito != null && alt.letra === gabarito;
    const mostrarResultado = gabarito !== undefined;
    const errada = mostrarResultado && marcada && gabarito !== null && alt.letra !== gabarito;

    return (
      <div
        key={alt.letra}
        role={interativo ? undefined : "group"}
        aria-label={interativo ? undefined : rotuloEstado(alt.letra, marcada, gabarito)}
        className={cn(
          "flex items-start gap-3 rounded-xs border p-3",
          "border-rule-strong",
          marcada && !mostrarResultado && "border-ink bg-paper-2",
          mostrarResultado && correta && "border-brand bg-brand-soft",
          mostrarResultado && errada && "border-err bg-err-soft",
        )}
      >
        {interativo ? (
          <RadioGroupPrimitive.Item
            value={alt.letra}
            aria-label={rotuloEstado(alt.letra, marcada, undefined)}
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-xs",
              "data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-paper",
            )}
          >
            {alt.letra}
          </RadioGroupPrimitive.Item>
        ) : (
          <span
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
              correta && "border-brand bg-brand text-on-brand",
              errada && "border-err bg-err text-on-err",
              !correta && !errada && "border-rule-strong text-ink-2",
            )}
          >
            {correta ? <Check className="size-3.5" strokeWidth={2.25} aria-hidden="true" /> : errada ? <X className="size-3.5" strokeWidth={2.25} aria-hidden="true" /> : alt.letra}
          </span>
        )}
        <p className="text-base text-ink">{textoBlocos(alt.conteudo)}</p>
      </div>
    );
  });

  if (!interativo) {
    return <div className={cn("flex flex-col gap-2", className)}>{itens}</div>;
  }

  return (
    <RadioGroupPrimitive.Root
      // "" nunca bate com nenhum `value` de alternativa (A-E): mesmo efeito visual de
      // undefined, mas mantém o RadioGroup controlado desde o primeiro render — só
      // null→undefined alternando fazia o Radix avisar "uncontrolled to controlled".
      value={respostaMarcada ?? ""}
      onValueChange={(v) => onRespostaChange?.(v as Letra)}
      className={cn("flex flex-col gap-2", className)}
      aria-label="Alternativas"
    >
      {itens}
    </RadioGroupPrimitive.Root>
  );
}
