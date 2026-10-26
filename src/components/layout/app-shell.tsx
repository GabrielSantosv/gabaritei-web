"use client";

import { useRouter } from "next/navigation";
import { getApi } from "@/lib/api/client";
import { SkipLink } from "./skip-link";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export interface AppShellProps {
  children: React.ReactNode;
  titulo?: string;
}

/** Casca do app (seção 8): sidebar ≥1024px, barra superior+inferior <1024px. */
export function AppShell({ children, titulo }: AppShellProps) {
  const router = useRouter();

  async function aoSair() {
    await getApi().sair();
    router.push("/entrar");
  }

  return (
    <div className="flex min-h-dvh">
      <SkipLink />
      <Sidebar onSair={aoSair} />
      {/* min-w-0: sem isso, um flex-1 não encolhe abaixo do min-content do que tiver dentro
          (ex.: a tabela de proficiência do Perfil) e isso vaza rolagem horizontal a 360px. */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center justify-between border-b border-rule bg-paper px-4 lg:hidden">
          <span className="font-serif text-lg text-ink">{titulo ?? "Gabaritei"}</span>
        </header>
        <main id="conteudo" className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
