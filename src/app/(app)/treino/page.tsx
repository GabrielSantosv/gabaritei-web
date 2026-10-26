import type { Metadata } from "next";
import { TreinoClient } from "./treino-client";

export const metadata: Metadata = { title: "Treino adaptativo" };

export default function TreinoPage() {
  return <TreinoClient />;
}
