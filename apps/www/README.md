# Instituto Português de Bitcoin

![hero](hero.png)

A construir o Futuro de Bitcoin em Portugal

[institutobitcoin.pt](https://institutobitcoin.pt)

## Getting Started

### Requirements

- [node](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

After installing everything, you should be able to run all the following commands:

```bash
node -v
pnpm -v
```

### Setup

Install dependencies

```bash
pnpm install
```

### Environment Variables

todo

### Run

Run all apps

```bash
pnpm dev
```

### Stripe

Listen to stripe events with stripe-cli:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe-webhook --events checkout.session.completed,invoice.payment_succeeded,customer.subscription.deleted
```

### Deploy

Deployments are done automatically when code is pushed to the `main` branch.

Deploy Number: 37
