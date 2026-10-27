import { redirect } from "next/navigation";

// Não existe mais uma tela "escolha uma área" antes do detalhe — "/desempenho"
// sempre foi um atalho, então ele cai direto numa área (LC), e o filtro de área
// dentro do próprio painel ([area]/desempenho-area-client.tsx) é que troca a tela.
export default function DesempenhoPage() {
  redirect("/desempenho/LC");
}
