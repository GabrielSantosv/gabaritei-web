import NextLink from "next/link";
import { Link } from "@/components/ui/link";
import { SkipLink } from "./skip-link";

export interface PublicShellProps {
  children: React.ReactNode;
}

/** Casca pública (seção 8): cabeçalho simples com logo, usada em entrar/cadastrar/termos/privacidade. */
export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SkipLink />
      <header className="flex min-h-14 items-center border-b border-rule px-4 lg:px-8">
        <NextLink href="/" className="font-serif text-lg text-ink no-underline">
          Gabaritei
        </NextLink>
      </header>
      <main id="conteudo" className="flex-1 px-4 py-8 lg:px-8">
        {children}
      </main>
      <footer className="flex gap-4 border-t border-rule px-4 py-4 text-sm text-ink-2 lg:px-8">
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
      </footer>
    </div>
  );
}
