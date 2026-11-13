<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="copy.title"
      :description="copy.description"
    >
      <div class="flex flex-wrap items-center gap-3">
        <UiButton size="lg" arrow to="#cursos">{{ copy.cta }}</UiButton>
        <UiButton
          size="lg"
          variant="outline"
          :to="localePath('curso-online-entrar')"
        >
          {{ account.email ? copy.myCourses : copy.alreadyBought }}
        </UiButton>
      </div>
    </IPBPageHeader>

    <section
      id="cursos"
      :aria-label="copy.coursesLabel"
      class="section section-gap"
    >
      <ul class="grid gap-6 lg:grid-cols-3">
        <li
          v-for="(course, index) in ONLINE_COURSES"
          :key="course.slug"
          class="reveal"
          :style="{ '--reveal-delay': `${index * 100}ms` }"
        >
          <IPBCourseCard :course="course" />
        </li>
      </ul>
      <p class="mt-6 text-sm text-neutral-500">{{ copy.contentNote }}</p>
    </section>

    <section aria-labelledby="how-heading" class="section pb-20 sm:pb-28">
      <div class="flex max-w-3xl flex-col gap-4">
        <h2 id="how-heading" class="section-title">{{ copy.howTitle }}</h2>
      </div>
      <ol class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(step, index) in copy.steps"
          :key="step.title"
          class="reveal flex flex-col gap-3 rounded-2xl bg-neutral-50 p-6"
          :style="{ '--reveal-delay': `${index * 100}ms` }"
        >
          <span class="font-mono text-xs text-neutral-500"
            >0{{ index + 1 }}</span
          >
          <h3 class="text-xl font-medium tracking-[-0.01em]">
            {{ step.title }}
          </h3>
          <p class="text-pretty text-neutral-600">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <section aria-labelledby="members-heading" class="section pb-20 sm:pb-28">
      <div
        class="reveal grid gap-10 rounded-3xl bg-neutral-950 px-6 py-12 text-white sm:px-12 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16"
      >
        <div class="flex max-w-2xl flex-col gap-4">
          <p class="eyebrow text-white/50">{{ copy.membersEyebrow }}</p>
          <h2 id="members-heading" class="section-title">
            {{ copy.membersTitle }}
          </h2>
          <p class="lead text-white/70">{{ copy.membersText }}</p>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div
              v-for="tier in tiers"
              :key="tier.name"
              class="rounded-xl bg-white/8 p-4"
            >
              <p
                class="font-mono text-[11px] tracking-wide text-white/50 uppercase"
              >
                {{ tier.name }}
              </p>
              <p class="mt-1 text-2xl font-medium">−{{ tier.pct }}%</p>
              <p class="text-sm text-white/70">
                {{ tier.price }} {{ copy.perCourse }}
              </p>
            </div>
          </div>
        </div>
        <UiButton size="lg" variant="inverse" arrow :to="localePath('juntar')">
          {{ copy.becomeMember }}
        </UiButton>
      </div>
    </section>

    <section aria-labelledby="faq-heading" class="section pb-20 sm:pb-28">
      <h2 id="faq-heading" class="section-title max-w-3xl">
        {{ copy.faqTitle }}
      </h2>
      <div class="mt-10 max-w-3xl border-t border-black/10">
        <details
          v-for="item in copy.faq"
          :key="item.q"
          class="group/faq border-b border-black/10 py-5"
        >
          <summary
            class="focus-ring flex cursor-pointer list-none items-center justify-between gap-6 rounded-sm text-lg font-medium tracking-[-0.01em] [&::-webkit-details-marker]:hidden"
          >
            {{ item.q }}
            <IconPlus
              class="size-4 shrink-0 transition-[rotate] duration-200 ease-out group-open/faq:rotate-45"
            />
          </summary>
          <p class="mt-3 max-w-2xl text-pretty text-neutral-600">
            {{ item.a }}
          </p>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const lang = useAppLocale();
const localePath = useLocalePath();
const { account } = useCourseAccount();

const COPY = {
  en: {
    alreadyBought: "I already bought a course",
    becomeMember: "Become a member",
    contentNote: "The lessons are written in Portuguese.",
    coursesLabel: "Online courses",
    cta: "See the courses",
    description:
      "Three self-paced courses that take you from why money loses value to your first transaction. 100% online, at your own pace, with a diploma at the end.",
    eyebrow: "Online courses",
    faq: [
      {
        a: "Yes. After paying, you can sign in with the email you bought with. We send a one-time code to it; there is no password. You can sign in from any device.",
        q: "How do I get in after buying?",
      },
      {
        a: "No. You get lifetime access to the course you bought, including the updates we make to it.",
        q: "Does access expire?",
      },
      {
        a: "When you mark every lesson as done, you can write your name and get a diploma you can print or save as PDF. It has a code anyone can use to check it.",
        q: "How does the diploma work?",
      },
      {
        a: "No. The courses explain what platforms may ask of you, but do not guide purchases and do not give financial advice. The practical workshops can be done without any money.",
        q: "Do I need to buy Bitcoin?",
      },
      {
        a: "Cards only, through Stripe. We never see your card details.",
        q: "How do I pay?",
      },
    ],
    faqTitle: "Questions",
    howTitle: "How it works",
    membersEyebrow: "Members",
    membersText:
      "IPB members get a discount on every online course. Sign up as a member, and verify your email at checkout to apply it.",
    membersTitle: "Members pay less",
    myCourses: "My courses",
    perCourse: "per course",
    steps: [
      {
        text: "Choose a course and pay by card. Members get a discount.",
        title: "Pay by card",
      },
      {
        text: "Your email is all you need. We send you a code, no password.",
        title: "Sign in with your email",
      },
      {
        text: "Short lessons with questions and hands-on exercises, at your own pace.",
        title: "Study at your pace",
      },
      {
        text: "Finish all the lessons and get a diploma with your name.",
        title: "Get your diploma",
      },
    ],
    title: "Learn Bitcoin at your own pace",
  },
  pt: {
    alreadyBought: "Já comprei um curso",
    becomeMember: "Tornar-me membro",
    contentNote: "As lições estão escritas em português.",
    coursesLabel: "Cursos online",
    cta: "Ver os cursos",
    description:
      "Três cursos de autoestudo, desde «porque é que o dinheiro perde valor» até à primeira transação. 100% online, ao ritmo de cada pessoa, com diploma no fim.",
    eyebrow: "Cursos online",
    faq: [
      {
        a: "Com o email usado na compra. É enviado um código de uso único; não há palavra-passe. É possível entrar a partir de qualquer dispositivo.",
        q: "Como se entra depois de comprar?",
      },
      {
        a: "Não. O acesso ao curso adquirido é para sempre, incluindo as atualizações que forem feitas.",
        q: "O acesso expira?",
      },
      {
        a: "Depois de todas as lições estarem marcadas como concluídas, escreve-se o nome e obtém-se um diploma que pode ser impresso ou guardado em PDF. Tem um código que qualquer pessoa pode usar para o verificar.",
        q: "Como funciona o diploma?",
      },
      {
        a: "Não. Os cursos explicam o que as plataformas podem pedir, mas não guiam compras nem dão aconselhamento financeiro. Os workshops práticos fazem-se sem dinheiro.",
        q: "É preciso comprar Bitcoin?",
      },
      {
        a: "Só com cartão, através da Stripe. O IPB nunca vê os dados do cartão.",
        q: "Como se paga?",
      },
    ],
    faqTitle: "Perguntas",
    howTitle: "Como funciona",
    membersEyebrow: "Membros",
    membersText:
      "Os membros do IPB têm desconto em todos os cursos online. Basta inscrever-se como membro e confirmar o email ao comprar para o aplicar.",
    membersTitle: "Os membros pagam menos",
    myCourses: "Os meus cursos",
    perCourse: "por curso",
    steps: [
      {
        text: "Escolhe-se um curso e paga-se com cartão. Os membros têm desconto.",
        title: "Pagamento com cartão",
      },
      {
        text: "O email chega. É enviado um código, sem palavra-passe.",
        title: "Entrada com o email",
      },
      {
        text: "Lições curtas com perguntas e exercícios práticos, ao ritmo de cada pessoa.",
        title: "Estudo ao próprio ritmo",
      },
      {
        text: "Concluídas todas as lições, recebe-se um diploma com o nome.",
        title: "Diploma",
      },
    ],
    title: "Aprender Bitcoin ao ritmo de cada pessoa",
  },
} as const;

const copy = computed(() => ({
  ...COPY[lang.value],
  ...COURSE_COPY[lang.value],
}));

const tiers = computed(() => [
  {
    name: lang.value === "en" ? "Participating member" : "Membro participante",
    pct: COURSE_DISCOUNT_PCT[1],
    price: formatEur(coursePriceCents(1), lang.value),
  },
  {
    name: lang.value === "en" ? "Ambassador member" : "Membro embaixador",
    pct: COURSE_DISCOUNT_PCT[2],
    price: formatEur(coursePriceCents(2), lang.value),
  },
]);

useSeoMeta({
  description: () => copy.value.description,
  ogDescription: () => copy.value.description,
  ogTitle: () => `${copy.value.title} | IPB`,
  title: () => copy.value.title,
});
</script>
