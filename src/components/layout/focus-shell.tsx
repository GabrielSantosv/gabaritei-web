"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkipLink } from "./skip-link";

export interface FocusShellProps {
  titulo: string;
  progresso?: React.ReactNode;
  mensagemSaida: string;
  onConfirmarSaida: () => void;
  children: React.ReactNode;
}

/** Casca de foco (seção 8): sem menu, só título + progresso + Sair com confirmação. */
export function FocusShell({ titulo, progresso, mensagemSaida, onConfirmarSaida, children }: FocusShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SkipLink />
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-rule px-4">
        <div className="flex items-center gap-3">
          <h1 tabIndex={-1} className="font-sans text-base font-medium text-ink">
            {titulo}
          </h1>
          {progresso}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variante="discreto" className="px-2">
              <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Sair
            </Button>
          </DialogTrigger>
          <DialogContent titulo="Sair agora?" descricao={mensagemSaida}>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variante="secundario">Continuar aqui</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variante="perigoso" onClick={onConfirmarSaida}>
                  Sair
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <main id="conteudo" className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
