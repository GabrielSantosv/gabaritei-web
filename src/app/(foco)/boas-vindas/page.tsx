import type { Metadata } from "next";
import { BoasVindasClient } from "./boas-vindas-client";

export const metadata: Metadata = { title: "Primeiros passos" };

export default function BoasVindasPage() {
  return <BoasVindasClient />;
}
