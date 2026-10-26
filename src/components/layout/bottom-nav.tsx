"use client";

import { CircleUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ITENS_NAV } from "./nav-itens";

/** Barra inferior <1024px (seção 8): Início, Treino, Questões, Simulados, Perfil. */
export function BottomNav() {
  const pathname = usePathname();
  const itens = [...ITENS_NAV, { href: "/perfil", rotulo: "Perfil", icone: CircleUser }];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-rule bg-paper-2 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {itens.map((item) => {
        const ativo = pathname?.startsWith(item.href);
        const Icone = item.icone;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center gap-0.5 border-t-[3px] border-t-transparent py-2 text-xs",
              ativo ? "border-t-brand font-medium text-ink" : "text-ink-2",
            )}
          >
            <Icone className="size-5" strokeWidth={1.75} aria-hidden="true" />
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
