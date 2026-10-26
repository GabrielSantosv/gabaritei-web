"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  titulo: string;
  descricao?: string;
}

export function DialogContent({ titulo, descricao, className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-md border border-rule bg-card p-6 shadow-[var(--shadow-overlay)]",
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="font-display text-xl text-ink">{titulo}</DialogPrimitive.Title>
            {descricao ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-ink-2">{descricao}</DialogPrimitive.Description>
            ) : (
              <VisuallyHidden.Root asChild>
                <DialogPrimitive.Description>Janela de diálogo.</DialogPrimitive.Description>
              </VisuallyHidden.Root>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="flex size-12 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogClose = DialogPrimitive.Close;
