"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/cn";

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
}

/** Campo de senha com botão mostrar/ocultar (aria-pressed), sem bloquear colar. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { rotulo, dica, erro, id, className, ...props },
  ref,
) {
  const [visivel, setVisivel] = useState(false);
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
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visivel ? "text" : "password"}
          aria-invalid={erro ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-12 w-full rounded-sm border border-rule-strong bg-card px-3 pr-12 text-base text-ink",
            erro && "border-err",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          aria-pressed={visivel}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2 hover:text-ink"
        >
          {visivel ? <EyeOff className="size-4" strokeWidth={1.75} aria-hidden="true" /> : <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
      {erro ? (
        <p id={erroId} className="text-sm text-err">
          {erro}
        </p>
      ) : null}
    </div>
  );
});
