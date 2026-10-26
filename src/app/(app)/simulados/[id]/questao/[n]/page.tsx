import type { Metadata } from "next";
import { CorrecaoClient } from "./correcao-client";

export const metadata: Metadata = { title: "Correção" };

export default function CorrecaoPage() {
  return <CorrecaoClient />;
}
