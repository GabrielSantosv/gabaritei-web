"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
}

/** Campo de texto com rótulo visível, dica e erro (aria-describedby + aria-invalid). */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { rotulo, dica, erro, id, className, ...props },
  ref,
) {
  const idGerado = useId();
  const inputId = id ?? idGerado;
  const dicaId = dica ? `${inputId}-dica` : undefined;
  const erroId = erro ? `${inputId}-erro` : undefined;
  const describedBy = [dicaId, erroId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {rotulo}
      </label>
      {dica ? (
        <p id={dicaId} className="text-sm text-ink-2">
          {dica}
        </p>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-12 rounded-sm border border-rule-strong bg-card px-3 text-base text-ink",
          "placeholder:text-ink-2",
          erro && "border-err",
          className,
        )}
        {...props}
      />
      {erro ? (
        <p id={erroId} className="text-sm text-err">
          {erro}
        </p>
      ) : null}
    </div>
  );
});
