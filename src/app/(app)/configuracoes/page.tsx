import type { Metadata } from "next";
import { ConfiguracoesClient } from "./configuracoes-client";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return <ConfiguracoesClient />;
}
