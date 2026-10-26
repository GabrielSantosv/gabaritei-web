"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ErroInesperado({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const codigo = error.digest ?? "sem-codigo";

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível: o código já está visível na tela
    }
  }

  return (
    <main
      id="conteudo"
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 tabIndex={-1} className="text-2xl text-ink">
        Algo deu errado do nosso lado.
      </h1>
      <p className="max-w-md text-ink-2">Tente de novo. Se continuar, avise a equipe com o código abaixo.</p>
      <button
        type="button"
        onClick={copiarCodigo}
        className="min-h-12 rounded-sm border border-rule-strong bg-card px-3 font-mono text-sm text-ink-2 hover:bg-paper-2"
      >
        {copiado ? "Código copiado" : `Código: ${codigo}`}
      </button>
      <Button onClick={reset} className="mt-2">
        Tentar de novo
      </Button>
    </main>
  );
}
