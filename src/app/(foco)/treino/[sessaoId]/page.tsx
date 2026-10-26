import type { Metadata } from "next";
import { SessaoClient } from "./sessao-client";

export const metadata: Metadata = { title: "Treino adaptativo" };

export default function SessaoPage() {
  return <SessaoClient />;
}
