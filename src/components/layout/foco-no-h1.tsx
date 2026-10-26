"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** O App Router não move o foco sozinho ao trocar de rota (seção 8). */
export function FocoNoH1() {
  const pathname = usePathname();

  useEffect(() => {
    // Todo h1 do app já declara tabIndex={-1} direto no JSX (nunca via setAttribute
    // aqui) — evita a divergência entre o HTML da primeira renderização do cliente
    // e o que a hidratação espera, que antes gerava aviso de hidratação no console.
    const h1 = document.querySelector("h1");
    h1?.focus();
  }, [pathname]);

  return null;
}
