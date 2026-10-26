import type { Metadata } from "next";
import { CadastrarClient } from "./cadastrar-client";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastrarPage() {
  return <CadastrarClient />;
}
