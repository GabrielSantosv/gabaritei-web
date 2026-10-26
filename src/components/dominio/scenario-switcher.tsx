"use client";

import { useEffect, useState } from "react";
import { CENARIOS, cenarioAtual, definirCenario, type CenarioId } from "@/lib/api/mock/cenarios";
import { apiMode } from "@/lib/api/client";

/** Só em desenvolvimento (seção 7.3): troca o cenário do mock e recarrega a página.
 *  bottom-right (não -left): o rodapé da Sidebar (Perfil/Configurações/Sair) fica
 *  embaixo à esquerda, e o indicador de dev do Next também é bottom-left por
 *  padrão (ver devIndicators em next.config.ts) — os dois cobririam o "Sair". */
export function ScenarioSwitcher() {
  const [atual, setAtual] = useState<CenarioId | null>(null);

  useEffect(() => {
    // Lê URL/localStorage, que só existem no navegador: precisa ser depois da
    // hidratação para o SSR não divergir do cliente (não é estado derivado de props).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAtual(cenarioAtual());
  }, []);

  if (process.env.NODE_ENV !== "development" || apiMode() !== "mock" || atual === null) return null;

  return (
    <div
      role="region"
      aria-label="Cenário do mock (ferramenta de desenvolvimento)"
      className="fixed bottom-4 right-4 z-40 rounded-sm border border-rule-strong bg-card p-3 text-xs shadow-[var(--shadow-overlay)]"
    >
      <label htmlFor="cenario-dev" className="mb-1 block font-medium text-ink">
        Cenário do mock
      </label>
      <select
        id="cenario-dev"
        value={atual}
        onChange={(e) => {
          const novo = e.target.value as CenarioId;
          setAtual(novo);
          definirCenario(novo);
          window.location.reload();
        }}
        className="min-h-9 rounded-xs border border-rule-strong bg-paper px-2 text-ink"
      >
        {CENARIOS.map((c) => (
          <option key={c.id} value={c.id} title={c.descricao}>
            {c.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
