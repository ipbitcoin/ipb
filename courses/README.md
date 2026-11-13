# Cursos online do IPB

Três cursos de autoestudo, 100% online, a 39 € cada, com diploma no fim:

| Pasta | Curso | Slug no site |
|---|---|---|
| `curso-1/` | A Génese | `a-genese` |
| `curso-2/` | A Tecnologia | `a-tecnologia` |
| `curso-3/` | A Revolução | `a-revolucao` |

Cada lição é um ficheiro HTML em `curso-N/html/`, com nome `M.L-titulo.html`. É assim que o site os serve: **a lista de lições, os títulos e a duração vêm dos próprios ficheiros** (`<h1>`, a linha «n min de leitura» e a etiqueta «Módulo…»). Para acrescentar, mudar o nome ou remover uma lição, basta mexer nos ficheiros e atualizar a numeração («Lição N de M», barra de progresso e ligações «Anterior/Seguinte»).

## Como o site usa estes ficheiros

- `apps/www/server/routes/aula/[curso]/[licao].get.ts` lê a lição, mete o `lesson.css` e o `lesson.js` dentro da página e só a entrega a quem comprou o curso (cookie de sessão). Sem sessão, redireciona para a entrada.
- Nas lições, estas ligações são trocadas pelo servidor: `#curso`, `#curso-2`, `#curso-3`, `#diploma` e as ligações `M.L-titulo.html`.
- O estado «lição concluída» é guardado na conta (Convex, tabela `courseOrders`). As listas de verificação ficam no browser do aluno.
- O diploma abre quando todas as lições do curso estão concluídas.

## Compra, descontos e acesso

- Preço e descontos: `packages/backend/convex/courseCatalog.ts` (`COURSE_PRICE_CENTS`, `COURSE_DISCOUNT_PCT`). O preço final é sempre decidido no servidor.
- Desconto de membro: o comprador confirma o email com o código enviado por email (o mesmo fluxo da formação presencial). Camada 1 (participante) = 10%, camada 2 (embaixador) = 25%.
- Pagamento: Stripe Checkout, só cartão. Em desenvolvimento, sem `STRIPE_SECRET_KEY`, a compra é simulada.
- Entrada: email da compra + código de uso único (Convex `courseLogins`, sessão em `courseSessions`).
- O Stripe tem de enviar `checkout.session.completed` para `/api/stripe-webhook` (já usado nas quotas).
- Convex precisa da variável `APP_URL` (site, por exemplo `https://institutobitcoin.pt`) para os emails de compra, além de `RESEND_API_KEY` e `SERVICE_KEY`.

## Trabalho local

```bash
bun run dev:backend   # Convex
bun run dev:www       # site
```

Os três cursos partilham o mesmo `lesson.css` e `lesson.js` (há uma cópia em cada pasta, para se poder abrir uma lição directamente). Se alterares um, copia-o para os outros.

Para rever factos: `grep -rn CONFIRMAR courses/*/html/`.
