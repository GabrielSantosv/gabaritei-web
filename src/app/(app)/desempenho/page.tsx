import type { Metadata } from "next";
import { DesempenhoClient } from "./desempenho-client";

export const metadata: Metadata = { title: "Desempenho" };

export default function DesempenhoPage() {
  return <DesempenhoClient />;
}
