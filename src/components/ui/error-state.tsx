"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  titulo?: string;
  mensagem: string;
  oQueFazer?: string;
  onTentarDeNovo?: () => void;
  className?: string;
}

/** Mensagem + o que fazer + tentar de novo (seção 9). Sem "Ops", sem pedir desculpa. */
export function ErrorState({ titulo = "Algo deu errado", mensagem, oQueFazer, onTentarDeNovo, className }: ErrorStateProps) {
  return (
    <div role="alert" className={className}>
      <div className="flex items-start gap-3 rounded-r-xs border-l-[3px] border-l-err bg-err-soft p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-err" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <p className="font-medium text-ink">{titulo}</p>
          <p className="mt-1 text-sm text-ink-2">{mensagem}</p>
          {oQueFazer ? <p className="mt-1 text-sm text-ink-2">{oQueFazer}</p> : null}
          {onTentarDeNovo ? (
            <Button variante="secundario" className="mt-3" onClick={onTentarDeNovo}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
