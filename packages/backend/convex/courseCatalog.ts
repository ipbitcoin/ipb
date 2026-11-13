/**
 * Catalog of the online courses: one place for prices, discounts and the
 * course list, shared by Convex functions, the www server routes and pages.
 * Plain TypeScript with no runtime imports, so every side can import it.
 *
 * The lessons themselves are the HTML files in `courses/<folder>/html`. The
 * www server reads them from there, so the lesson list is never repeated here.
 */

/** Price of each online course, in euro cents. */
export const COURSE_PRICE_CENTS = 3900;

/**
 * Discount on the online courses per membership layer, in percent.
 * Layer 1 = participating member (€21/year), layer 2 = ambassador.
 */
export const COURSE_DISCOUNT_PCT = { 1: 10, 2: 25 } as const;

export type CourseMemberLayer = keyof typeof COURSE_DISCOUNT_PCT;

/** Price in euro cents for a buyer who is (or is not) a verified member. */
export function coursePriceCents(layer?: CourseMemberLayer): number {
  const pct = layer ? COURSE_DISCOUNT_PCT[layer] : 0;
  return Math.round((COURSE_PRICE_CENTS * (100 - pct)) / 100);
}

export interface OnlineCourse {
  slug: string;
  number: 1 | 2 | 3;
  /** Folder under `courses/` that holds the lessons. */
  folder: string;
  title: { pt: string; en: string };
  tagline: { pt: string; en: string };
  description: { pt: string; en: string };
  /** What the learner can do at the end. */
  outcomes: { pt: string[]; en: string[] };
  /** Approximate study time, shown on the diploma and the course page. */
  hours: number;
  /** Used in the diploma text. */
  diplomaTopic: { pt: string };
}

export const ONLINE_COURSES: readonly OnlineCourse[] = [
  {
    description: {
      en: "Why money loses value, what Bitcoin proposes and what to know before you ever buy any. No prior knowledge needed.",
      pt: "Porque é que o dinheiro perde valor, o que a Bitcoin propõe e o que convém saber antes de comprar. Não são precisos conhecimentos prévios.",
    },
    diplomaTopic: {
      pt: "a origem do dinheiro, a inflação e os fundamentos da Bitcoin",
    },
    folder: "curso-1",
    hours: 3,
    number: 1,
    outcomes: {
      en: [
        "Explain why money loses purchasing power and who gains and loses from it.",
        "Explain Bitcoin and digital scarcity in plain words.",
        "Weigh the strongest criticisms and know what platforms may ask of you.",
      ],
      pt: [
        "Explicar porque é que o dinheiro perde poder de compra e quem ganha e perde com isso.",
        "Explicar em palavras simples o que é a Bitcoin e a escassez digital.",
        "Avaliar as críticas mais sérias e saber o que uma plataforma pode pedir.",
      ],
    },
    slug: "a-genese",
    tagline: { en: "Why Bitcoin", pt: "Porquê a Bitcoin" },
    title: { en: "Genesis", pt: "A Génese" },
  },
  {
    description: {
      en: "How Bitcoin works inside, what a wallet really is and how to keep your own Bitcoin safe. Ends with a hands-on workshop.",
      pt: "Como a Bitcoin funciona por dentro, o que é realmente uma carteira e como guardar o próprio Bitcoin em segurança. Termina com um workshop prático.",
    },
    diplomaTopic: {
      pt: "o funcionamento da rede, as carteiras e a autocustódia",
    },
    folder: "curso-2",
    hours: 3,
    number: 2,
    outcomes: {
      en: [
        "Explain how a transaction gets into the blockchain and why it cannot be forged.",
        "Tell Bitcoin apart from the rest of the crypto world.",
        "Create, delete and restore a wallet, and store your recovery phrase safely.",
      ],
      pt: [
        "Explicar como uma transação entra na blockchain e porque não se falsifica.",
        "Distinguir a Bitcoin do resto do mundo «cripto».",
        "Criar, apagar e restaurar uma carteira e guardar a frase de recuperação em segurança.",
      ],
    },
    slug: "a-tecnologia",
    tagline: {
      en: "How it works and how to keep it",
      pt: "Como funciona e como guardar",
    },
    title: { en: "Technology", pt: "A Tecnologia" },
  },
  {
    description: {
      en: "Using Bitcoin day to day, Portuguese and European rules and taxes, and the honest case for and against. Ends with your first transaction.",
      pt: "Usar a Bitcoin no dia a dia, as regras e os impostos em Portugal e na Europa, e os argumentos a favor e contra. Termina com a primeira transação.",
    },
    diplomaTopic: {
      pt: "o uso da Bitcoin, a sua regulação e fiscalidade em Portugal",
    },
    folder: "curso-3",
    hours: 3,
    number: 3,
    outcomes: {
      en: [
        "Know how to pay, save and borrow with Bitcoin, and the risks of each.",
        "Know which rules and taxes apply in Portugal and what to ask an accountant.",
        "Argue for and against Bitcoin with facts, and make your first transaction.",
      ],
      pt: [
        "Saber como pagar, poupar e pedir emprestado com Bitcoin, e os riscos de cada um.",
        "Saber que regras e impostos se aplicam em Portugal e o que perguntar a um contabilista.",
        "Argumentar a favor e contra a Bitcoin com factos e fazer a primeira transação.",
      ],
    },
    slug: "a-revolucao",
    tagline: { en: "Using it and the rules", pt: "Usar e as regras" },
    title: { en: "Revolution", pt: "A Revolução" },
  },
];

export const COURSE_SLUGS = ONLINE_COURSES.map((c) => c.slug);

export function findCourse(slug: string): OnlineCourse | undefined {
  return ONLINE_COURSES.find((c) => c.slug === slug);
}
