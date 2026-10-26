import { ProgressBar } from "./progress-bar";

export interface ProgressToMinimumProps {
  atual: number;
  minimo: number;
  rotulo?: string;
  className?: string;
}

/** "12 de 20 respostas para estimar sua proficiência" (seção 2, regra 5: nunca número estimado antes do mínimo). */
export function ProgressToMinimum({ atual, minimo, rotulo, className }: ProgressToMinimumProps) {
  const faltam = Math.max(0, minimo - atual);
  return (
    <div className={className}>
      <p className="text-sm text-ink-2">
        {faltam > 0
          ? `Faltam ${faltam} ${faltam === 1 ? "resposta" : "respostas"} para ${rotulo ?? "ter esse dado"}.`
          : `Dados suficientes para ${rotulo ?? "esse dado"}.`}
      </p>
      <ProgressBar valor={atual} total={minimo} rotulo={rotulo ?? "progresso para o mínimo de respostas"} className="mt-2" />
    </div>
  );
}
