import type { Metadata } from "next";
import { SecaoLegal } from "@/components/layout/secao-legal";

export const metadata: Metadata = { title: "Privacidade" };

// TODO(equipe): data da última revisão real do texto.
const ULTIMA_ATUALIZACAO = "23 de outubro de 2026";

/** Página provisória (tela 14): só os links do cadastro não quebrarem. Texto é do grupo. */
export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl py-4 lg:py-12 print:max-w-none">
      <h1 tabIndex={-1} className="text-2xl text-ink">
        Política de Privacidade
      </h1>
      <p className="mt-1 text-sm text-ink-2">Última atualização: {ULTIMA_ATUALIZACAO}</p>

      <div className="mt-6">
        <SecaoLegal id="dados-coletados" titulo="Quais dados coletamos" />
        <SecaoLegal id="uso-dos-dados" titulo="Para que usamos seus dados" />
        <SecaoLegal id="retencao" titulo="Por quanto tempo guardamos" />
        <SecaoLegal id="menores-de-18" titulo="Menores de 18 anos" />
        <SecaoLegal id="contato" titulo="Contato" />
      </div>
    </div>
  );
}
