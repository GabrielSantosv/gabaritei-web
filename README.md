# Gabaritei

Plataforma de estudos adaptativos para o ENEM: treino por sessão, banco de questões com filtros, simulados no
formato da prova, histórico de atividades e recomendações guiadas por um critério sempre explicado.

Construído em [Next.js](https://nextjs.org) (App Router) com TypeScript e Tailwind CSS. Nesta fase o front-end
conversa com uma API simulada que roda inteiramente no navegador (`localStorage`), para desenvolvimento e
demonstração sem depender do back-end.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A barra "Dados de demonstração" no topo e o seletor de cenário
(canto inferior, em desenvolvimento) deixam claro que os dados são fictícios.

## Scripts úteis

- `npm run test` — testes unitários (Vitest)
- `npm run test:e2e` — testes ponta a ponta (Playwright)
- `npm run test:a11y` — testes de acessibilidade (axe)
- `npm run audit:contraste` / `npm run audit:paletas` — auditorias de contraste e paletas de cor
- `npm run check:regras` — varredura estática das regras de design do projeto

## Deploy

Compatível com deploy direto na [Vercel](https://vercel.com/new).
