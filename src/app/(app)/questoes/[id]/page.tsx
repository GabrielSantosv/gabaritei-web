import type { Metadata } from "next";
import { QuestaoClient } from "./questao-client";

export const metadata: Metadata = { title: "Questão" };

export default function QuestaoPage() {
  return <QuestaoClient />;
}
