export {
  COURSE_DISCOUNT_PCT,
  COURSE_PRICE_CENTS,
  ONLINE_COURSES,
  coursePriceCents,
} from "@ipb/backend/courseCatalog";
export type { OnlineCourse } from "@ipb/backend/courseCatalog";

export type Lang = "pt" | "en";

/** "39 €" / "€39", and "35,10 €" when there are cents. */
export function formatEur(cents: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "en" ? "en-IE" : "pt-PT", {
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

export function formatDate(timestamp: number, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "pt-PT", {
    dateStyle: "long",
  }).format(new Date(timestamp));
}

export interface CourseProgress {
  completed: string[];
  diploma: { code: string; issuedAt?: number; name?: string } | null;
  slug: string;
  total: number;
}

export interface CourseAccountData {
  courses: CourseProgress[];
  email: string | null;
}

export interface LessonSummary {
  id: string;
  minutes: number;
  module: number;
  moduleName: string;
  slug: string;
  title: string;
}

/** Page copy. The lessons themselves are in Portuguese. */
export const COURSE_COPY = {
  en: {
    already: "You already own this course.",
    alreadySignIn: "Sign in to continue",
    buy: "Buy with card",
    buying: "Opening secure payment…",
    cancelled: "Payment cancelled. You were not charged.",
    cardOnly: "Secure card payment through Stripe.",
    code: "6-digit code",
    codeSent:
      "If this email belongs to an active member, we sent a code. Check your spam folder too.",
    confirmCode: "Apply discount",
    contentNote: "The courses are written in Portuguese.",
    continue: "Continue",
    diploma: "Diploma",
    email: "Your email",
    emailHint: "This email is all you need to get in. No password.",
    free: "Included",
    genericError: "Something went wrong. Please try again.",
    hours: "about 3 hours",
    iAmMember: "I am an IPB member",
    lessons: "lessons",
    memberDiscount: (pct: number, who: string) =>
      `${who} member: ${pct}% off applied.`,
    memberFail: "That code did not work. Check it and try again.",
    memberLayers: { 1: "Participating", 2: "Ambassador" } as Record<
      1 | 2,
      string
    >,
    notMember: "Not a member?",
    price: "Price",
    progress: (done: number, total: number) =>
      `${done} of ${total} lessons done`,
    seeCourse: "See the course",
    sendCode: "Send code",
    signIn: "Sign in",
    start: "Start the course",
    wrongEmail: "Enter a valid email address.",
  },
  pt: {
    already: "Este curso já foi adquirido com este email.",
    alreadySignIn: "Entrar para continuar",
    buy: "Comprar com cartão",
    buying: "A abrir o pagamento seguro…",
    cancelled: "Pagamento cancelado. Não foste cobrado.",
    cardOnly: "Pagamento seguro com cartão, através da Stripe.",
    code: "Código de 6 dígitos",
    codeSent:
      "Se este email for de um membro ativo, enviámos um código. Convém ver também o spam.",
    confirmCode: "Aplicar desconto",
    contentNote: "Os cursos estão escritos em português.",
    continue: "Continuar",
    diploma: "Diploma",
    email: "Email",
    emailHint:
      "Este email é tudo o que é preciso para entrar. Sem palavra-passe.",
    free: "Incluído",
    genericError: "Ocorreu um erro. Tenta outra vez.",
    hours: "cerca de 3 horas",
    iAmMember: "Sou membro do IPB",
    lessons: "lições",
    memberDiscount: (pct: number, who: string) =>
      `Membro ${who}: desconto de ${pct}% aplicado.`,
    memberFail:
      "Esse código não funcionou. Convém confirmar e tentar outra vez.",
    memberLayers: { 1: "participante", 2: "embaixador" } as Record<
      1 | 2,
      string
    >,
    notMember: "Ainda não é membro?",
    price: "Preço",
    progress: (done: number, total: number) =>
      `${done} de ${total} lições concluídas`,
    seeCourse: "Ver o curso",
    sendCode: "Enviar código",
    signIn: "Entrar",
    start: "Começar o curso",
    wrongEmail: "Indicar um email válido.",
  },
} as const;
