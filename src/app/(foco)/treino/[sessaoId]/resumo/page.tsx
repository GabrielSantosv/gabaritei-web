import type { Metadata } from "next";
import { ResumoClient } from "./resumo-client";

export const metadata: Metadata = { title: "Sessão concluída" };

export default function ResumoPage() {
  return <ResumoClient />;
}
