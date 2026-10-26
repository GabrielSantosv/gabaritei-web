"use client";

import { Check, Flag, Minus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Letra } from "@/lib/api/types";
import { Segmented } from "@/components/ui/segmented";

export interface CartaoRespostaItem {
  n: number;
  resposta: Letra | null;
  gabarito: Letra;
  correta: boolean;
  marcada: boolean;
}

export interface CartaoRespostaProps {
  itens: CartaoRespostaItem[];
  hrefBase: (n: number) => string;
  className?: string;
}

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];
type Filtro = "todas" | "erradas" | "em_branco" | "marcadas";

function descricaoResultado(item: CartaoRespostaItem): string {
  if (item.resposta === null) return `gabarito ${item.gabarito}.`;
  if (item.correta) return `você acertou, marcou ${item.resposta}.`;
  return `você errou, marcou ${item.resposta}, gabarito ${item.gabarito}.`;
}

function Bolha({ letra, item }: { letra: Letra; item: CartaoRespostaItem }) {
  const marcadaPeloEstudante = item.resposta === letra;
  const ehGabarito = item.gabarito === letra;

  if (marcadaPeloEstudante && item.correta) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-brand text-on-brand" aria-hidden="true">
        <Check className="size-3.5" strokeWidth={2.25} />
      </span>
    );
  }
  if (marcadaPeloEstudante && !item.correta) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-err text-on-err" aria-hidden="true">
        <X className="size-3.5" strokeWidth={2.25} />
      </span>
    );
  }
  if (ehGabarito && !item.correta) {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full border-2 border-brand text-brand-ink"
        aria-hidden="true"
      >
        <Check className="size-3" strokeWidth={2.25} />
      </span>
    );
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full border border-rule-strong text-[10px] text-ink-2">
      {letra}
    </span>
  );
}

/**
 * Sem aria-label sobrepondo tudo: o nome acessível do link é formado pelo
 * próprio conteúdo visível (número, bolhas, "em branco") mais um complemento
 * visualmente oculto (sr-only, não aria-hidden) — assim o texto visível
 * sempre faz parte do nome acessível (WCAG 2.5.3 Label in Name).
 */
function Linha({ item, hrefBase, indice }: { item: CartaoRespostaItem; hrefBase: (n: number) => string; indice: number }) {
  return (
    <li className="cartao-entrada" style={{ animationDelay: `${Math.min(indice * 18, 850)}ms` }}>
      <Link
        href={hrefBase(item.n)}
        className="flex items-center gap-2 rounded-xs px-1 py-1 hover:bg-paper-2 focus-visible:bg-paper-2"
      >
        <span className="w-6 shrink-0 font-mono text-xs text-ink-2">
          <span className="sr-only">Questão </span>
          {item.n}
        </span>
        {item.resposta === null ? (
          <span className="flex items-center gap-1.5 text-xs text-ink-2">
            <Minus className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            em branco
          </span>
        ) : (
          <span className="flex gap-1">
            {LETRAS.map((letra) => (
              <Bolha key={letra} letra={letra} item={item} />
            ))}
          </span>
        )}
        {item.marcada ? <Flag className="size-3.5 shrink-0 text-ink" strokeWidth={1.75} aria-hidden="true" /> : null}
        <span className="sr-only">
          {`: ${descricaoResultado(item)}`}
          {item.marcada ? " Marcada para revisar." : ""}
        </span>
      </Link>
    </li>
  );
}

/** O elemento memorável do design system (seção 6): bolhas A–E como a folha de verdade. */
export function CartaoResposta({ itens, hrefBase, className }: CartaoRespostaProps) {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const filtrados = useMemo(() => {
    switch (filtro) {
      case "erradas":
        return itens.filter((i) => i.resposta !== null && !i.correta);
      case "em_branco":
        return itens.filter((i) => i.resposta === null);
      case "marcadas":
        return itens.filter((i) => i.marcada);
      default:
        return itens;
    }
  }, [itens, filtro]);

  const grupos = useMemo(() => {
    const porGrupo = 15;
    const total = Math.ceil(filtrados.length / porGrupo) || 1;
    return Array.from({ length: total }, (_, i) => filtrados.slice(i * porGrupo, i * porGrupo + porGrupo));
  }, [filtrados]);

  return (
    <div className={className}>
      <Segmented
        rotulo="Filtrar questões do cartão-resposta"
        valor={filtro}
        onValorChange={setFiltro}
        opcoes={[
          { valor: "todas", rotulo: "Todas" },
          { valor: "erradas", rotulo: "Erradas" },
          { valor: "em_branco", rotulo: "Em branco" },
          { valor: "marcadas", rotulo: "Marcadas" },
        ]}
        className="mb-4"
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-brand text-on-brand">
            <Check className="size-3" strokeWidth={2.25} aria-hidden="true" />
          </span>
          Você acertou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-err text-on-err">
            <X className="size-3" strokeWidth={2.25} aria-hidden="true" />
          </span>
          Você errou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-brand text-brand-ink">
            <Check className="size-2.5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          Gabarito oficial
        </span>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-ink-2">Nenhuma questão nesse filtro.</p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          {grupos.map((grupo, i) => (
            <ol key={i} className="flex-1 space-y-0.5">
              {grupo.map((item, j) => (
                <Linha key={item.n} item={item} hrefBase={hrefBase} indice={i * 15 + j} />
              ))}
            </ol>
          ))}
        </div>
      )}
    </div>
  );
}
