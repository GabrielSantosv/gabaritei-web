"use client";

import { Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface FoguinhoBadgeProps {
  atual: number;
  melhor?: number;
  hojeContou: boolean;
  emRisco: boolean;
  className?: string;
  // P2, Início: dentro da faixa principal (fundo --brand-hover/--brand-soft),
  // os tokens --brand/--ink/--ink-2 não têm contraste garantido (são pensados
  // pro fundo normal da página). Nesse contexto, usa `currentColor` em tudo —
  // a cor certa (--on-brand ou --ink, já escolhida pela própria faixa) vem por
  // herança do elemento pai, e cada estado já se distingue pelo texto e pelo
  // preenchimento do ícone (seção 4.3: "nenhuma informação depende só do acento").
  dentroDaFaixa?: boolean;
  // "faixa" (padrão): o selo completo (ícone + número + "Melhor" + frase de
  // estado) — usado no Perfil. "chip" (Início novo): só "Foguinho: N dias
  // seguidos", compacto, ao lado da saudação — e nada quando a sequência está
  // zerada ou a conta não tem histórico (sem cobrança, regra da etapa V).
  variante?: "faixa" | "chip";
}

type EstadoFoguinho = "acesa" | "em-espera" | "zerada";

function estadoDoFoguinho(atual: number, hojeContou: boolean): EstadoFoguinho {
  if (atual === 0) return "zerada";
  return hojeContou ? "acesa" : "em-espera";
}

/**
 * check-regras: ignore (comentário cita a proibição, não usa o token)
 * Nunca --amber (regra 9). Informativo, nunca punitivo (seção 9): 3 estados derivados de
 * `atual`/`hojeContou`/`emRisco` (etapa V, item 4) — nunca um texto de "quebrou" ou "apagou".
 */
export function FoguinhoBadge({
  atual,
  melhor,
  hojeContou,
  emRisco,
  className,
  dentroDaFaixa,
  variante = "faixa",
}: FoguinhoBadgeProps) {
  // Hooks sempre no topo, antes de qualquer return condicional (regra dos
  // hooks) — a animação só importa pra variante "faixa", mas o estado/efeito
  // tem que rodar em toda renderização, não só quando essa variante é usada.
  const anteriorRef = useRef(hojeContou);
  const [acendendoAgora, setAcendendoAgora] = useState(false);

  // Anima só a transição "ainda não contou hoje" → "já conta", nunca ao montar
  // (senão toda carga de página piscaria a chama) nem de "zerada" pra "acesa" direto.
  useEffect(() => {
    if (!anteriorRef.current && hojeContou) {
      setAcendendoAgora(true);
      const id = setTimeout(() => setAcendendoAgora(false), 420);
      anteriorRef.current = hojeContou;
      return () => clearTimeout(id);
    }
    anteriorRef.current = hojeContou;
  }, [hojeContou]);

  if (variante === "chip") {
    if (atual === 0) return null;
    return (
      <span
        className={cn(
          "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-current px-2.5 py-0.5 text-[0.8125rem] font-semibold",
          className,
        )}
      >
        <Flame className="size-3.5 fill-current" strokeWidth={1.75} aria-hidden="true" />
        Foguinho: {atual} {atual === 1 ? "dia" : "dias"} seguidos
      </span>
    );
  }

  const estado = estadoDoFoguinho(atual, hojeContou);

  const corIcone = dentroDaFaixa
    ? "text-current"
    : estado === "acesa"
      ? "text-brand"
      : estado === "em-espera"
        ? "text-ink"
        : "text-ink-2";
  const corNumero = dentroDaFaixa ? "text-current" : estado === "zerada" ? "text-ink-2" : "text-ink";
  const corTextoSecundario = dentroDaFaixa ? "text-current" : "text-ink-2";

  const texto =
    estado === "acesa"
      ? "Hoje já conta."
      : estado === "zerada"
        ? "Comece sua sequência hoje."
        : emRisco
          ? "Responda uma questão hoje para manter o Foguinho."
          : "Ainda não contou hoje.";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Flame
          className={cn(
            "size-5 motion-safe-transition",
            corIcone,
            estado === "acesa" && "fill-current",
            acendendoAgora && "scale-125",
          )}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className={cn("font-display text-xl", corNumero)}>{atual}</span>
        <span className={cn("text-sm", corTextoSecundario)}>{atual === 1 ? "dia" : "dias"}</span>
      </div>
      {typeof melhor === "number" ? <span className={cn("text-sm", corTextoSecundario)}>Melhor: {melhor}</span> : null}
      <span className={cn("text-sm", corTextoSecundario)}>{texto}</span>
    </div>
  );
}
