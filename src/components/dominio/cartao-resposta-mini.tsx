"use client";

import { Check, Flag, X } from "lucide-react";
import Link from "next/link";
import type { Letra } from "@/lib/api/types";
import { cn } from "@/lib/cn";

interface ItemTreino {
  n: number;
  letra: Letra | null;
}

interface ItemSimulado {
  n: number;
  resposta: Letra | null;
  marcada: boolean;
}

interface ItemResumo {
  n: number;
  letra: Letra;
  correta: boolean;
  href: string;
}

export type CartaoRespostaMiniProps =
  | { variante: "treino"; itens: ItemTreino[]; atual: number; className?: string }
  | {
      variante: "simulado";
      itens: ItemSimulado[];
      atual: number;
      onSelecionar: (n: number) => void;
      className?: string;
    }
  | { variante: "resumo"; itens: ItemResumo[]; className?: string }
  // Início novo: a folha de cartão-resposta ao lado da faixa é só ilustração —
  // nenhum dado do usuário, por isso não recebe `itens`. Marcações e a linha
  // "atual" são fixas (exemplo), igual à referência.
  | { variante: "decorativa"; className?: string };

const LETRAS_DECORATIVA = ["A", "B", "C", "D", "E"] as const;
const MARCADAS_DECORATIVA: Record<number, string> = { 1: "C", 2: "A", 3: "E" };

function LinhaDecorativa({ n }: { n: number }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xs px-1.5 py-0.5",
        n === 4 && "bg-brand-soft ring-1 ring-inset ring-brand",
      )}
    >
      <span className="w-5 shrink-0 font-mono text-xs text-ink-2">{String(n).padStart(2, "0")}</span>
      {LETRAS_DECORATIVA.map((l) => (
        <span
          key={l}
          className={cn(
            "flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border font-mono text-[0.6875rem]",
            MARCADAS_DECORATIVA[n] === l ? "border-ink bg-ink text-paper" : "border-rule-strong text-ink-2",
          )}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

/** Indicador de progresso compacto (seção 9). Treino: fileira simples. Simulado: grade clicável. Resumo: grade com link de revisão. Decorativa: ilustração fixa (Início). */
export function CartaoRespostaMini(props: CartaoRespostaMiniProps) {
  if (props.variante === "decorativa") {
    return (
      <div aria-hidden="true" className={cn("flex flex-col gap-2.5 rounded-md bg-paper p-4 text-ink", props.className)}>
        <div className="flex justify-center gap-3.5">
          <div className="flex flex-col gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <LinhaDecorativa key={n} n={n} />
            ))}
          </div>
          <div className="flex flex-col gap-0.5">
            {[6, 7, 8, 9, 10].map((n) => (
              <LinhaDecorativa key={n} n={n} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (props.variante === "treino") {
    const { itens, atual, className } = props;
    return (
      <ol className={cn("flex items-center gap-1", className)} aria-label="Progresso da sessão">
        {itens.map((item) => (
          <li key={item.n}>
            <span
              aria-label={
                item.letra
                  ? `Questão ${item.n}, respondida com ${item.letra}`
                  : item.n === atual
                    ? `Questão ${item.n}, atual`
                    : `Questão ${item.n}, não respondida`
              }
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-[10px] font-mono",
                item.n === atual ? "border-brand bg-brand text-on-brand" : "border-rule-strong text-ink-2",
                item.letra && item.n !== atual && "border-rule-strong bg-paper-2 text-ink",
              )}
            >
              {item.letra ?? item.n}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  if (props.variante === "resumo") {
    const { itens, className } = props;
    return (
      <ol className={cn("grid grid-cols-5 gap-1.5 sm:grid-cols-6", className)} aria-label="Questões da sessão">
        {itens.map((item) => (
          <li key={item.n}>
            <Link
              href={item.href}
              aria-label={`Questão ${item.n}: você ${item.correta ? "acertou" : "errou"}, marcou ${item.letra}. Ver revisão.`}
              className={cn(
                "flex size-12 items-center justify-center gap-0.5 rounded-xs border text-xs font-mono",
                "motion-safe-transition hover:opacity-80",
                item.correta ? "border-brand bg-brand-soft text-brand-ink" : "border-err bg-err-soft text-err",
              )}
            >
              {item.correta ? (
                <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
              ) : (
                <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    );
  }

  const { itens, atual, onSelecionar, className } = props;
  return (
    <ol className={cn("grid grid-cols-5 gap-1.5 sm:grid-cols-6", className)} aria-label="Cartão-resposta do simulado">
      {itens.map((item) => {
        const rotulo = `Questão ${item.n}${item.resposta ? `, respondida com ${item.resposta}` : ", em branco"}${
          item.marcada ? ", marcada para revisar" : ""
        }${item.n === atual ? ", atual" : ""}`;
        return (
          <li key={item.n}>
            <button
              type="button"
              aria-label={rotulo}
              aria-current={item.n === atual ? "true" : undefined}
              onClick={() => onSelecionar(item.n)}
              className={cn(
                "relative flex size-12 items-center justify-center rounded-xs border text-xs font-mono",
                "motion-safe-transition",
                item.n === atual && "border-brand ring-2 ring-brand",
                item.resposta ? "border-rule-strong bg-paper-2 text-ink" : "border-rule-strong text-ink-2",
              )}
            >
              {item.resposta ?? item.n}
              {item.marcada ? (
                <Flag className="absolute -right-1 -top-1 size-3 text-ink" strokeWidth={2} aria-hidden="true" />
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
