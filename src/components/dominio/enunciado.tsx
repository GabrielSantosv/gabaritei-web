"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { Bloco } from "@/lib/api/types";
import { Disclosure } from "@/components/ui/disclosure";

export interface EnunciadoProps {
  blocos: Bloco[];
  descricaoAbertaPorPadrao?: boolean;
}

function BlocoFigura({ figura, abertaPorPadrao }: { figura: Bloco & { tipo: "figura" }; abertaPorPadrao: boolean }) {
  const semDescricao = !figura.figura.alt && !figura.figura.audiodescricao;
  const [aberta, setAberta] = useState(abertaPorPadrao);

  return (
    <figure className="my-4 rounded-xs border border-rule bg-paper-2 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={figura.figura.src}
        alt={figura.figura.alt ?? ""}
        role={figura.figura.alt ? undefined : "presentation"}
        className="mx-auto max-h-64 object-contain"
      />
      {semDescricao ? (
        <figcaption className="mt-2 flex items-center gap-1.5 text-sm text-ink-2">
          <ImageOff className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Sem descrição cadastrada para esta figura.
        </figcaption>
      ) : figura.figura.audiodescricao ? (
        <figcaption className="mt-2">
          <button
            type="button"
            aria-expanded={aberta}
            onClick={() => setAberta((a) => !a)}
            className="min-h-12 text-sm font-medium text-brand-ink underline underline-offset-2"
          >
            {aberta ? "Ocultar descrição da figura" : "Ler descrição da figura"}
          </button>
          {aberta ? <p className="mt-2 text-sm text-ink-2">{figura.figura.audiodescricao}</p> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Enunciado serifado (seção 6): blocos de texto/citação/figura/fórmula. Nunca inventa descrição (regra 4). */
export function Enunciado({ blocos, descricaoAbertaPorPadrao = false }: EnunciadoProps) {
  return (
    <div className="font-serif text-lg leading-[1.65] text-ink [&_p]:mb-3 [&>*:last-child]:mb-0">
      {blocos.map((bloco, i) => {
        if (bloco.tipo === "texto") return <p key={i}>{bloco.texto}</p>;
        if (bloco.tipo === "citacao")
          return (
            <blockquote key={i} className="border-l-[3px] border-l-rule-strong pl-4 italic text-ink-2">
              <p>{bloco.texto}</p>
              {bloco.fonte ? <cite className="mt-1 block text-sm not-italic">{bloco.fonte}</cite> : null}
            </blockquote>
          );
        if (bloco.tipo === "figura") return <BlocoFigura key={i} figura={bloco} abertaPorPadrao={descricaoAbertaPorPadrao} />;
        if (bloco.tipo === "formula")
          return (
            <Disclosure key={i} titulo={<span className="font-mono text-sm">{bloco.latex}</span>}>
              <p>{bloco.leitura}</p>
            </Disclosure>
          );
        return null;
      })}
    </div>
  );
}
