import NextLink from "next/link";
import { Link } from "@/components/ui/link";

export default function NaoEncontrada() {
  return (
    <main id="conteudo" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 tabIndex={-1} className="text-2xl text-ink">
        Não achamos essa página.
      </h1>
      <p className="max-w-md text-ink-2">O endereço pode estar errado ou a página pode ter sido movida.</p>
      <div className="mt-2 flex items-center gap-4">
        <NextLink
          href="/inicio"
          className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand px-4 text-sm font-medium text-on-brand no-underline hover:bg-brand-hover"
        >
          Ir para o início
        </NextLink>
        <Link href="/questoes">Ver questões</Link>
      </div>
    </main>
  );
}
