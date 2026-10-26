import type { Metadata } from "next";
import { SimuladoClient } from "./simulado-client";

export const metadata: Metadata = { title: "Simulado" };

export default function SimuladoPage() {
  return <SimuladoClient />;
}
