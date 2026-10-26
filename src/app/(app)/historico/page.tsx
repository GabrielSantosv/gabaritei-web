import type { Metadata } from "next";
import { HistoricoClient } from "./historico-client";

export const metadata: Metadata = { title: "Histórico" };

export default function HistoricoPage() {
  return <HistoricoClient />;
}
