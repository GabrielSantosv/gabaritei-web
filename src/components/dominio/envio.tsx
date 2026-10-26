"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";

export interface EnvioProps {
  respostaSelecionada: boolean;
  enviando?: boolean;
  onEnviar: () => void;
  className?: string;
}

/**
 * Bloqueia reenvio e explica em vez de ficar cinza mudo quando falta escolher
 * uma alternativa (seção 9): usa aria-disabled, não disabled, para o clique
 * poder disparar o aviso e focar o grupo de alternativas.
 */
export function Envio({ respostaSelecionada, enviando = false, onEnviar, className }: EnvioProps) {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const avisoId = useId();

  function aoClicar() {
    if (!respostaSelecionada) {
      setMostrarAviso(true);
      document.querySelector<HTMLElement>('[role="radiogroup"]')?.focus();
      return;
    }
    setMostrarAviso(false);
    onEnviar();
  }

  return (
    <div className={className}>
      <Button
        onClick={aoClicar}
        carregando={enviando}
        textoCarregando="Enviando"
        aria-disabled={!respostaSelecionada || undefined}
        aria-describedby={mostrarAviso ? avisoId : undefined}
      >
        Enviar resposta
      </Button>
      {mostrarAviso ? (
        <p id={avisoId} role="alert" className="mt-2 text-sm text-err">
          Escolha uma alternativa antes de enviar.
        </p>
      ) : null}
    </div>
  );
}
