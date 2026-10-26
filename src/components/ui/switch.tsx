"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  rotulo: string;
  descricao?: string;
}

export function Switch({ rotulo, descricao, id, className, ...props }: SwitchProps) {
  const idGerado = useId();
  const switchId = id ?? idGerado;
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <div>
        <label htmlFor={switchId} className="text-sm font-medium text-ink">
          {rotulo}
        </label>
        {descricao ? <p className="text-sm text-ink-2">{descricao}</p> : null}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-rule-strong bg-paper-2",
          "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
          "motion-safe-transition",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "size-[18px] translate-x-0.5 rounded-full bg-card",
            "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-on-brand",
            "motion-safe-transition",
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
