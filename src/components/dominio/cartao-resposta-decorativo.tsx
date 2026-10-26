import { cn } from "@/lib/cn";

const LETRAS = ["A", "B", "C", "D", "E"];
// Padrão fixo (não aleatório) só para ter algumas bolhas "preenchidas" na ilustração.
const PREENCHIDAS = [1, 2, 0, 3, 4, 2, 1, 0];

export interface CartaoRespostaDecorativoProps {
  className?: string;
}

/** Miniatura decorativa do cartão-resposta (seção 10.1, tela 1). Só ilustração: aria-hidden. */
export function CartaoRespostaDecorativo({ className }: CartaoRespostaDecorativoProps) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      {PREENCHIDAS.map((indicePreenchido, linha) => (
        <div key={linha} className="flex items-center gap-2">
          <span className="w-5 font-mono text-xs text-ink-2">{linha + 1}</span>
          <span className="flex gap-1.5">
            {LETRAS.map((letra, i) => (
              <span
                key={letra}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[10px]",
                  i === indicePreenchido
                    ? "border-brand bg-brand text-on-brand"
                    : "border-rule-strong text-ink-2",
                )}
              >
                {letra}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
