import type { Metadata } from "next";
import { QuestoesClient } from "./questoes-client";

export const metadata: Metadata = { title: "Questões" };

export default function QuestoesPage() {
  return <QuestoesClient />;
}
