"use client";

import { AlertTriangle } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface ErroDeCampo {
  id: string;
  rotulo: string;
}

export interface FormErrorSummaryProps {
  titulo: string;
  mensagem?: string;
  erros?: ErroDeCampo[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Resumo de erros que recebe o foco ao falhar o envio (seção 10.1, tela 1).
 * Use um ref e chame `.focus()` depois de setar o estado de erro.
 */
export const FormErrorSummary = forwardRef<HTMLDivElement, FormErrorSummaryProps>(function FormErrorSummary(
  { titulo, mensagem, erros, children, className },
  ref,
) {
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={cn("rounded-r-xs border-l-[3px] border-l-err bg-err-soft p-4", className)}
    >
      <p className="flex items-center gap-2 font-medium text-ink">
        <AlertTriangle className="size-4 shrink-0 text-err" strokeWidth={1.75} aria-hidden="true" />
        {titulo}
      </p>
      {mensagem ? <p className="mt-1 text-sm text-ink-2">{mensagem}</p> : null}
      {erros && erros.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {erros.map((erro) => (
            <li key={erro.id}>
              <a href={`#${erro.id}`} className="text-sm text-brand-ink underline underline-offset-2">
                {erro.rotulo}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </div>
  );
});
