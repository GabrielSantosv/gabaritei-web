import type { Metadata } from "next";
import { DesempenhoAreaClient } from "./desempenho-area-client";

export const metadata: Metadata = { title: "Desempenho" };

export default function DesempenhoAreaPage() {
  return <DesempenhoAreaClient />;
}
