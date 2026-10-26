"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  rotulo: React.ReactNode;
}

export function Checkbox({ rotulo, className, id, ...props }: CheckboxProps) {
  const idGerado = useId();
  const checkboxId = id ?? idGerado;
  return (
    <div className="flex min-h-12 items-center gap-2.5">
      <CheckboxPrimitive.Root
        id={checkboxId}
        className={cn(
          "flex size-5 items-center justify-center rounded-xs border border-rule-strong bg-card",
          "data-[state=checked]:bg-brand data-[state=checked]:border-brand",
          "motion-safe-transition",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3.5 text-on-brand" strokeWidth={2.25} aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={checkboxId} className="text-sm text-ink">
        {rotulo}
      </label>
    </div>
  );
}
