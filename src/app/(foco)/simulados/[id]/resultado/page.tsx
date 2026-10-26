import type { Metadata } from "next";
import { ResultadoClient } from "./resultado-client";

export const metadata: Metadata = { title: "Resultado do simulado" };

export default function ResultadoPage() {
  return <ResultadoClient />;
}
