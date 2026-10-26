"use client";

import { useEffect } from "react";
import { aplicarAparencia, lerAparenciaSalva } from "@/lib/hooks/use-aparencia";

/**
 * `data-theme` em si já reage ao SO via CSS puro (`@media prefers-color-scheme`);
 * `<meta name="theme-color">` não, porque é um atributo estático. Com tema
 * "sistema", recalcula o `theme-color` quando o SO troca claro/escuro com o app
 * já aberto, sem esperar o usuário mudar nada (docs/FRONTEND_PARIDADE.md, 4.2).
 */
export function AparenciaSync() {
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const sincronizar = () => {
      const aparencia = lerAparenciaSalva();
      if (aparencia.tema === "sistema") aplicarAparencia(aparencia);
    };
    consulta.addEventListener("change", sincronizar);
    return () => consulta.removeEventListener("change", sincronizar);
  }, []);

  return null;
}
