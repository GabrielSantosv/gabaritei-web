"use client";

import { CircleUser, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { ITENS_NAV } from "./nav-itens";

export interface SidebarProps {
  recolhida?: boolean;
  onSair?: () => void;
}

/** Barra lateral ≥1024px (seção 8): 240px, recolhe para só ícones com tooltip + aria-label. */
export function Sidebar({ recolhida = false, onSair }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "hidden h-dvh flex-col justify-between border-r border-rule bg-paper-2 py-4 lg:flex",
        recolhida ? "w-[72px]" : "w-60",
      )}
    >
      <div>
        <div className="px-4 py-2">
          <span className="font-serif text-lg text-ink">{recolhida ? "G" : "Gabaritei"}</span>
        </div>

        <ul className="mt-4 flex flex-col gap-1 px-2">
          {ITENS_NAV.map((item) => {
            const ativo = pathname?.startsWith(item.href);
            const Icone = item.icone;
            const link = (
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-sm border-l-[3px] border-l-transparent px-3 text-sm",
                  "motion-safe-transition",
                  ativo ? "border-l-brand font-medium text-ink" : "text-ink-2 hover:bg-paper hover:text-ink",
                )}
              >
                <Icone className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {!recolhida && item.rotulo}
              </Link>
            );
            return <li key={item.href}>{recolhida ? <Tooltip conteudo={item.rotulo}>{link}</Tooltip> : link}</li>;
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-1 px-2">
        {recolhida ? (
          <Tooltip conteudo="Perfil">
            <Link href="/perfil" className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink">
              <CircleUser className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </Tooltip>
        ) : (
          <Link href="/perfil" className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink">
            <CircleUser className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Perfil
          </Link>
        )}
        {recolhida ? (
          <Tooltip conteudo="Configurações">
            <Link href="/configuracoes" className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink">
              <Settings className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </Tooltip>
        ) : (
          <Link href="/configuracoes" className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink">
            <Settings className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Configurações
          </Link>
        )}
        <button
          type="button"
          onClick={onSair}
          className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink"
        >
          <LogOut className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {!recolhida && "Sair"}
        </button>
      </div>
    </nav>
  );
}
