"use client";

import type { ComboEstado, Faixa } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DEGRAUS: { faixa: Faixa; rotulo: string }[] = [
  { faixa: "facil", rotulo: "Fácil" },
  { faixa: "media", rotulo: "Média" },
  { faixa: "dificil", rotulo: "Difícil" },
];

function mensagemEvento(estado: ComboEstado): string | null {
  switch (estado.evento) {
    case "subiu":
      return `Combo ${estado.atual}. As próximas questões sobem para ${DEGRAUS[estado.degrau].rotulo.toLowerCase()}.`;
    case "desceu":
      return `Combo reiniciado. As próximas questões voltam para ${DEGRAUS[estado.degrau].rotulo.toLowerCase()}.`;
    case "reiniciou":
      return "Combo reiniciado.";
    case "no_topo":
      return `Combo ${estado.atual}. Você já está na dificuldade mais alta.`;
    default:
      return null;
  }
}

export interface ComboMeterProps {
  estado: ComboEstado;
  className?: string;
}

/** Escada de 3 degraus + contagem. Sem som, sem brilho, sem confete (seção 9). */
export function ComboMeter({ estado, className }: ComboMeterProps) {
  const anuncio = mensagemEvento(estado);

  return (
    <div className={cn("rounded-md bg-paper-2 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">Combo</p>
        <span className="font-mono text-sm text-ink">×{estado.atual}</span>
      </div>

      <ol className="mt-3 flex items-center gap-1.5">
        {DEGRAUS.map((degrau, i) => (
          <li
            key={degrau.faixa}
            className={cn(
              "flex-1 rounded-xs border border-rule-strong py-2 text-center text-xs font-medium text-ink-2",
              "motion-safe-transition",
              i === estado.degrau && "border-brand bg-brand-soft text-brand-ink",
            )}
            style={{ transitionDuration: "240ms" }}
            aria-current={i === estado.degrau ? "step" : undefined}
          >
            {degrau.rotulo}
          </li>
        ))}
      </ol>

      <p className="mt-2 text-sm text-ink-2">
        {estado.acertosParaSubir === null
          ? "Você já está na dificuldade mais alta."
          : `Faltam ${estado.acertosParaSubir} ${estado.acertosParaSubir === 1 ? "acerto" : "acertos"} para subir para ${DEGRAUS[Math.min(estado.degrau + 1, 2)].rotulo.toLowerCase()}.`}
      </p>

      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      <Dialog>
        <DialogTrigger asChild>
          <Button variante="discreto" className="mt-2 px-0">
            Como o Combo funciona
          </Button>
        </DialogTrigger>
        <DialogContent titulo="Como o Combo funciona">
          <p className="text-sm text-ink-2">
            A cada {estado.config.acertosPorDegrau} acertos seguidos, a dificuldade das próximas questões sobe um
            degrau (começa fácil, passa por média, chega a difícil). Quando você erra, a dificuldade{" "}
            {estado.config.noErro === "reinicia" ? "volta para fácil" : "desce um degrau"}.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
