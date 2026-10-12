<template>
  <div>
    <IPBPageHeader
      :eyebrow="t('training.tag')"
      :title="content.title"
      :description="content.lead"
    >
      <div class="flex flex-wrap gap-3">
        <UiButton size="lg" to="#enrollment">
          {{ content.register }}
          <IconArrow class="size-4 rotate-90" />
        </UiButton>
        <UiButton size="lg" variant="outline" to="#program">
          {{ content.program.title }}
          <IconArrow class="size-4 rotate-90" />
        </UiButton>
      </div>
    </IPBPageHeader>

    <!-- The course in one photo, then the logistics at a glance. Together they
         are the last step of the header's staged entrance. -->
    <div class="enter section mt-12 sm:mt-16" style="--enter-delay: 300ms">
      <div
        class="relative aspect-3/2 overflow-hidden rounded-3xl bg-neutral-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline after:-outline-offset-1 after:outline-black/10 sm:aspect-2/1"
      >
        <!-- The wide crop keeps the banner and screen, losing floor instead. -->
        <NuxtImg
          src="/curso.jpeg"
          :alt="content.heroAlt"
          sizes="xs:100vw xl:1216px"
          loading="eager"
          fetchpriority="high"
          class="absolute inset-0 size-full object-cover sm:object-[50%_30%]"
        />
      </div>

      <section aria-labelledby="facts-heading" class="mt-10">
        <h2 id="facts-heading" class="sr-only">{{ content.facts.title }}</h2>
        <dl class="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          <div
            v-for="fact in facts"
            :key="fact.label"
            class="flex flex-col gap-1.5 border-t border-black/10 pt-5"
          >
            <dt
              class="font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-neutral-500 uppercase"
            >
              {{ fact.label }}
            </dt>
            <dd
              class="mt-1 text-lg leading-snug font-medium tracking-[-0.01em] text-pretty"
            >
              {{ fact.value }}
            </dd>
            <dd v-if="fact.note" class="text-sm text-pretty text-neutral-600">
              {{ fact.note }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <section aria-labelledby="learn-heading" class="section section-gap">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
        <h2 id="learn-heading" class="reveal section-title">
          {{ content.learn.title }}
        </h2>
        <ol class="border-t border-black/10">
          <li
            v-for="(item, index) in content.learn.items"
            :key="item"
            class="reveal flex items-baseline gap-6 border-b border-black/10 py-6 sm:py-8"
            :style="{ '--reveal-delay': `${index * 100}ms` }"
          >
            <span
              aria-hidden="true"
              class="font-mono text-xs leading-4 font-medium text-neutral-500 tabular-nums"
            >
              {{ String(index + 1).padStart(2, "0") }}
            </span>
            <p
              class="text-xl leading-snug tracking-[-0.015em] text-pretty sm:text-2xl"
            >
              {{ item }}
            </p>
          </li>
        </ol>
      </div>
    </section>

    <section
      aria-labelledby="audience-heading"
      class="section section-gap pt-0"
    >
      <h2 id="audience-heading" class="reveal section-title max-w-3xl">
        {{ content.audience.title }}
      </h2>
      <div class="mt-12 grid gap-4 sm:mt-14 md:grid-cols-2">
        <div
          v-for="(group, index) in content.audience.groups"
          :key="group.title"
          class="reveal flex flex-col gap-6 rounded-2xl border border-transparent bg-white p-6 shadow-border sm:p-8"
          :style="{ '--reveal-delay': `${index * 100}ms` }"
        >
          <h3 class="text-xl leading-snug font-medium tracking-[-0.015em]">
            {{ group.title }}
          </h3>
          <ul class="flex flex-col gap-4">
            <li
              v-for="question in group.items"
              :key="question"
              class="flex items-start gap-3 leading-relaxed text-pretty text-neutral-600"
            >
              <!-- The eyebrow's orange block, as a bullet. -->
              <span
                aria-hidden="true"
                class="mt-2.5 size-1.5 shrink-0 bg-brand"
              />
              {{ question }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section aria-labelledby="program-heading" class="section section-gap pt-0">
      <div
        id="program"
        class="relative isolate rounded-3xl bg-neutral-950 px-6 py-14 text-white max-sm:-mx-6 max-sm:rounded-none sm:px-12 sm:py-16 lg:px-16 lg:py-20"
      >
        <!-- The site's grid motif, fading out from the corner. -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(to_right,oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.06)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_70%_60%_at_0%_0%,black,transparent_70%)]"
        />

        <div class="reveal flex max-w-3xl flex-col gap-4">
          <p class="eyebrow text-white/50">{{ content.program.eyebrow }}</p>
          <h2 id="program-heading" class="section-title">
            {{ content.program.title }}
          </h2>
        </div>

        <!-- On wide screens the modules share rows (subgrid), so titles, topics
             and workshops line up across the three columns. -->
        <ol
          class="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-3 lg:grid-rows-[auto_1fr_auto]"
        >
          <li
            v-for="(module, index) in content.program.modules"
            :key="module.title"
            class="reveal flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/4 p-6 sm:p-8 lg:row-span-3 lg:grid lg:grid-rows-subgrid"
            :style="{ '--reveal-delay': `${index * 100}ms` }"
          >
            <div class="flex flex-col gap-4">
              <span
                aria-hidden="true"
                class="font-mono text-xs leading-4 font-medium text-brand tabular-nums"
              >
                {{ String(index + 1).padStart(2, "0") }}
              </span>
              <h3 class="text-2xl leading-tight tracking-tight">
                {{ module.title }}
              </h3>
            </div>
            <ul class="flex flex-col gap-3">
              <li
                v-for="topic in module.topics"
                :key="topic"
                class="flex items-start gap-3 leading-relaxed text-pretty text-white/70"
              >
                <span
                  aria-hidden="true"
                  class="mt-2.5 size-1 shrink-0 rounded-full bg-white/40"
                />
                {{ topic }}
              </li>
            </ul>
            <div class="border-t border-white/10 pt-6">
              <p
                class="font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-brand uppercase"
              >
                {{ module.workshop.label }}
              </p>
              <p class="mt-3 text-lg leading-snug font-medium">
                {{ module.workshop.motto }}
              </p>
              <p class="mt-1 leading-relaxed text-pretty text-white/60">
                {{ module.workshop.description }}
              </p>
            </div>
          </li>
        </ol>

        <div
          class="reveal mt-12 flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between"
        >
          <p
            class="max-w-md text-2xl leading-tight tracking-tight text-balance sm:text-3xl"
          >
            {{ content.program.cta }}
          </p>
          <div class="flex flex-col gap-3 sm:items-end">
            <UiButton size="lg" variant="brand" to="#enrollment">
              {{ content.register }}
              <IconArrow class="size-4 rotate-90" />
            </UiButton>
            <p class="text-sm text-white/60">{{ content.program.summary }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="section section-gap pt-0">
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Each document sits on a grey stage, like a print on a table. -->
        <section
          v-for="(item, index) in content.included"
          :key="item.title"
          :aria-labelledby="`included-${index}`"
          class="reveal flex flex-col rounded-3xl border border-transparent bg-white p-2 shadow-border"
          :style="{ '--reveal-delay': `${index * 100}ms` }"
        >
          <div class="rounded-2xl bg-neutral-100 p-6 sm:p-10">
            <NuxtImg
              :src="item.src"
              :alt="item.alt"
              :width="item.width"
              :height="item.height"
              sizes="xs:100vw lg:500px"
              loading="lazy"
              class="h-auto w-full rounded-sm shadow-book outline -outline-offset-1 outline-black/10"
            />
          </div>
          <div class="flex flex-col gap-3 p-4 sm:p-6">
            <h2
              :id="`included-${index}`"
              class="text-2xl leading-tight tracking-tight text-balance"
            >
              {{ item.title }}
            </h2>
            <p class="leading-relaxed text-pretty text-neutral-600">
              <!-- Odd parts carry the emphasis the copy calls for. -->
              <template v-for="(part, partIndex) in item.text" :key="partIndex">
                <strong
                  v-if="partIndex % 2"
                  class="font-medium text-neutral-950"
                >
                  {{ part }}
                </strong>
                <template v-else>{{ part }}</template>
              </template>
            </p>
          </div>
        </section>
      </div>
    </div>

    <section
      aria-labelledby="trainers-heading"
      class="section section-gap pt-0"
    >
      <h2 id="trainers-heading" class="reveal section-title">
        {{ content.trainers.title }}
      </h2>
      <ul
        role="list"
        class="mt-12 grid gap-x-8 gap-y-12 sm:mt-14 md:grid-cols-2"
      >
        <li
          v-for="(trainer, index) in content.trainers.people"
          :key="trainer.name"
          class="reveal flex flex-col gap-6 border-t border-black/10 pt-6 sm:flex-row"
          :style="{ '--reveal-delay': `${index * 100}ms` }"
        >
          <NuxtImg
            :src="trainer.image"
            :alt="trainer.name"
            width="112"
            height="112"
            fit="cover"
            loading="lazy"
            class="size-28 shrink-0 rounded-2xl bg-neutral-100 object-cover outline -outline-offset-1 outline-black/10"
          />
          <div>
            <h3
              class="text-xl leading-snug font-medium tracking-[-0.015em] text-balance"
            >
              {{ trainer.name }}
            </h3>
            <p
              class="mt-2 font-mono text-[11px] leading-4 tracking-[0.08em] text-pretty text-neutral-500 uppercase"
            >
              {{ trainer.role }}
            </p>
            <ul
              class="mt-4 flex flex-col gap-2 text-[15px] leading-relaxed text-pretty text-neutral-600"
            >
              <li v-for="detail in trainer.details" :key="detail">
                {{ detail }}
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </section>

    <section aria-labelledby="goal-heading" class="section">
      <div
        class="grid gap-10 rounded-3xl bg-brand-soft px-6 py-12 max-sm:-mx-6 max-sm:rounded-none sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16"
      >
        <div class="reveal flex flex-col gap-4">
          <h2 id="goal-heading" class="section-title">
            {{ content.goal.title }}
          </h2>
          <p class="lead">{{ content.goal.intro }}</p>
        </div>
        <div>
          <ul class="flex flex-col gap-5">
            <li
              v-for="(item, index) in content.goal.items"
              :key="item"
              class="reveal flex items-start gap-4 text-lg leading-snug text-pretty"
              :style="{ '--reveal-delay': `${index * 100}ms` }"
            >
              <span
                aria-hidden="true"
                class="grid size-7 shrink-0 place-items-center rounded-full bg-neutral-950 text-white"
              >
                <IconCheck class="size-3.5" />
              </span>
              <span class="pt-0.5">{{ item }}</span>
            </li>
          </ul>
          <p
            class="reveal mt-10 border-t border-black/10 pt-8 leading-relaxed text-pretty text-neutral-700"
          >
            {{ content.goal.closing }}
          </p>
        </div>
      </div>
    </section>

    <!-- No bottom padding: the FAQ below brings its own. -->
    <section
      id="enrollment"
      aria-labelledby="enrollment-heading"
      class="section section-gap pb-0"
    >
      <div
        class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-16 xl:gap-24"
      >
        <!-- The prices stay beside the form while it scrolls, once they fit
             side by side and the column is short enough to stick. -->
        <div class="flex flex-col gap-10 xl:sticky xl:top-28 xl:self-start">
          <div class="reveal flex flex-col gap-4">
            <p class="eyebrow">{{ content.enrollment.eyebrow }}</p>
            <h2 id="enrollment-heading" class="section-title">
              {{ content.enrollment.title }}
            </h2>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div
              class="reveal flex flex-col gap-6 rounded-2xl bg-neutral-950 p-6 text-white sm:p-8"
            >
              <div class="flex flex-col gap-2">
                <p class="eyebrow text-white/50">
                  {{ content.enrollment.individuals.label }}
                </p>
                <h3 class="mt-1 text-xl leading-snug font-medium text-balance">
                  {{ content.enrollment.individuals.title }}
                </h3>
                <p class="text-white/60">
                  {{ content.enrollment.individuals.detail }}
                </p>
              </div>
              <p class="mt-auto flex flex-wrap items-baseline gap-x-2">
                <span class="text-4xl tracking-[-0.03em] tabular-nums">
                  {{ content.enrollment.individuals.price }}
                </span>
                <span class="text-sm text-white/60">
                  {{ content.enrollment.individuals.vat }}
                </span>
              </p>
            </div>

            <div
              class="reveal flex flex-col gap-6 rounded-2xl border border-transparent bg-white p-6 shadow-border sm:p-8"
              style="--reveal-delay: 100ms"
            >
              <div class="flex flex-col gap-2">
                <p class="eyebrow">{{ content.enrollment.companies.label }}</p>
                <h3 class="mt-1 text-xl leading-snug font-medium text-balance">
                  {{ content.enrollment.companies.title }}
                </h3>
                <p class="text-pretty text-neutral-600">
                  {{ content.enrollment.companies.detail }}
                </p>
              </div>
              <UiButton
                variant="outline"
                :href="`mailto:${CONTACT_EMAIL}`"
                class="mt-auto self-start"
              >
                {{ t("training.cta.info") }}
              </UiButton>
            </div>
          </div>
        </div>

        <div
          class="reveal rounded-2xl border border-transparent bg-white p-5 text-neutral-950 shadow-popover sm:p-8"
          style="--reveal-delay: 100ms"
        >
          <IPBTrainingEnrollment
            :sessions="sessions"
            :unavailable="unavailable"
          />
        </div>
      </div>
    </section>

    <IPBFaq
      :faqs="content.faq.items"
      :title="content.faq.title"
      :description="content.faq.description"
    >
      <UiButton size="lg" :href="`mailto:${CONTACT_EMAIL}`">
        {{ t("training.cta.info") }}
      </UiButton>
      <UiButton
        size="lg"
        variant="outline"
        href="https://calendar.app.google/gyFsbCtUTmZBbgPt8"
        target="_blank"
      >
        {{ t("training.cta.schedule") }}
        <span class="sr-only">({{ t("common.newTab") }})</span>
      </UiButton>
    </IPBFaq>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale, t } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const localePath = useLocalePath();
// Social cards and structured data need absolute addresses.
const siteUrl = useSiteConfig().url;
const absoluteUrl = (path: string) => new URL(path, siteUrl).href;

const CONTENT = {
  en: {
    audience: {
      groups: [
        {
          items: [
            "Want to learn from reliable sources with peace of mind?",
            "Want to avoid crypto pyramid schemes?",
            "Looking to protect your savings in a sovereign way?",
          ],
          title: "Individuals",
        },
        {
          items: [
            "Looking to attract new clients with Bitcoin?",
            "Want to innovate in payment methods?",
            "Aiming to unite teams around financial innovation?",
          ],
          title: "Companies & Organizations",
        },
      ],
      title: "Who is this training for?",
    },
    course: {
      description:
        "8-hour in-person Bitcoin training. Learn the essentials in a simple and practical way: history of money, Bitcoin technology, self-custody and everyday use.",
      teaches: [
        "Bitcoin essentials",
        "Self-custody and security",
        "How to buy and use Bitcoin",
        "Lightning Network",
        "Regulatory framework",
      ],
    },
    enrollment: {
      companies: {
        detail: "Contact us for a tailored proposal",
        label: "For companies",
        title: "Upon request",
      },
      eyebrow: "Registrations open",
      individuals: {
        detail: "3 practical workshops",
        label: "For individuals",
        price: "€200",
        title: "Bitcoin for Everyone (8h)",
        vat: "(VAT included)",
      },
      title: "Register",
    },
    facts: {
      items: [
        { label: "Price", note: "VAT included", value: "€200" },
        { label: "Duration", note: "Full day", value: "8 hours" },
        {
          label: "Format",
          note: "Maximum 10 participants",
          value: "In-person only",
        },
      ],
      next: "Next session",
      soldOut: "Sold out",
      title: "Logistics",
      toBeAnnounced: "To be announced",
    },
    faq: {
      description:
        "Here are the most common ones. For anything else, write to us or schedule a call.",
      items: [
        {
          answer:
            "You will learn the Bitcoin essentials in a simple and practical way: how it works, how to buy it, how to store it in self-custody, and how to use it in everyday life. The training includes 3 practical workshops.",
          question: "What will I learn in the Bitcoin for Everyone training?",
        },
        {
          answer:
            "The training costs €200 (VAT included) for individuals. Companies and organisations can contact us for a tailored proposal.",
          question: "What is the price of the training?",
        },
        {
          answer:
            "The training lasts 8 hours (full day), in an in-person format only, with a maximum of 10 participants.",
          question: "How long is the training?",
        },
        {
          answer:
            "Yes. At the end of the course you will receive a training certificate issued by the Portuguese Bitcoin Institute.",
          question: "Will I receive a certificate at the end?",
        },
      ],
      title: "Have questions?",
    },
    goal: {
      closing:
        "And above all, staying connected with the IPB through our digital community, with ongoing access to people, knowledge sharing, events, and support throughout your journey.",
      intro: "More than learning concepts, what matters is:",
      items: [
        "Feeling confident to use Bitcoin autonomously",
        "Avoiding common mistakes and unnecessary losses",
        "Protecting your money safely",
      ],
      title: "The real goal",
    },
    heroAlt: "Bitcoin for Everyone course",
    included: [
      {
        alt: "Self-custody best practices booklet",
        height: 1130,
        src: "/folheto_en.jpeg",
        text: [
          "You will receive a practical booklet with a clear guide to securely storing your recovery phrase, avoiding irreversible losses, and following self-custody best practices.",
        ],
        title: "Included Resources",
        width: 1600,
      },
      {
        alt: "Training certificate",
        height: 1054,
        src: "/diploma_en.jpeg",
        text: [
          "At the end of the course you will receive a ",
          "training certificate",
          " issued by the Portuguese Bitcoin Institute.",
        ],
        title: "Training Certificate",
        width: 1492,
      },
    ],
    lead: "Bitcoin is the future of money. The sooner you understand it, the greater your advantage.",
    learn: {
      items: [
        "The essentials of Bitcoin, in a simple and practical way",
        "How to protect your privacy and financial sovereignty",
        "How to buy, store and use Bitcoin safely",
      ],
      title: "What you'll learn",
    },
    program: {
      cta: "Secure your spot in the next course.",
      eyebrow: "3 practical workshops",
      modules: [
        {
          title: "The Genesis",
          topics: [
            "A brief history of money",
            "The problem is inflation",
            "The solution is Bitcoin",
            "The discovery of digital scarcity",
          ],
          workshop: {
            description: "How to buy Bitcoin safely",
            label: "Workshop #1",
            motto: "Don't trust. Verify!",
          },
        },
        {
          title: "The Technology",
          topics: [
            "The blockchain",
            "Mining",
            "Bitcoin is not Crypto",
            "Bitcoin wallets",
            "FUD — Fear, uncertainty and doubt",
            "The Lightning Network",
          ],
          workshop: {
            description: "How to store Bitcoin in self-custody",
            label: "Workshop #2",
            motto: "Not your keys. Not your coins!",
          },
        },
        {
          title: "The Revolution",
          topics: [
            "An instrument of freedom",
            "Regulatory framework",
            "Opportunities for individuals and companies",
          ],
          workshop: {
            description: "How to use Bitcoin in everyday life",
            label: "Workshop #3",
            motto: "Fix the money. Fix the world!",
          },
        },
      ],
      summary: "€200 · 8 hours · In-person",
      title: "Program",
    },
    register: "Register now",
    title: "Bitcoin for Everyone",
    trainers: {
      people: [
        {
          details: [
            "Former Director and Vice-President at Veolia",
            "Postgraduate degree from MIT Portugal and Mechanical Engineering degree from Instituto Superior Técnico",
          ],
          image: "/formador_antonio.jpeg",
          name: "António Neves da Silva",
          role: "Founder of MoT Inteligência Energética",
        },
        {
          details: [
            "Software Engineer at Mindera",
            "MSc in Computer Science (AI) from the Faculty of Engineering, University of Porto",
          ],
          image: "/formador_tomas.JPG",
          name: "Tomás Mamede",
          role: "Chairman of the General Assembly of the Portuguese Bitcoin Institute",
        },
      ],
      title: "The Trainers",
    },
  },
  pt: {
    audience: {
      groups: [
        {
          items: [
            "Quer aprender com fontes fiáveis e em serenidade?",
            "Deseja evitar esquemas de pirâmide cripto?",
            "Procura proteger as suas poupanças de forma soberana?",
          ],
          title: "Particulares",
        },
        {
          items: [
            "Procuram atrair novos clientes com Bitcoin?",
            "Querem inovar nos meios de pagamento?",
            "Ambicionam unir equipas em torno da inovação financeira?",
          ],
          title: "Empresas & Organizações",
        },
      ],
      title: "Para quem é esta formação?",
    },
    course: {
      description:
        "Formação presencial de 8 horas sobre Bitcoin. Aprenda o essencial de forma simples e prática: história do dinheiro, tecnologia Bitcoin, auto-custódia e utilização no dia a dia.",
      teaches: [
        "O essencial sobre Bitcoin",
        "Auto-custódia e segurança",
        "Como comprar e usar Bitcoin",
        "Rede Lightning",
        "Enquadramento regulamentar",
      ],
    },
    enrollment: {
      companies: {
        detail: "Contacte-nos para uma proposta personalizada",
        label: "Para empresas",
        title: "Sob consulta",
      },
      eyebrow: "Inscrições abertas",
      individuals: {
        detail: "3 workshops práticos",
        label: "Para particulares",
        price: "200 €",
        title: "Bitcoin para Todos (8h)",
        vat: "(IVA incluído)",
      },
      title: "Inscrever-se",
    },
    facts: {
      items: [
        { label: "Preço", note: "IVA incluído", value: "200 €" },
        { label: "Duração", note: "Dia inteiro", value: "8 horas" },
        {
          label: "Formato",
          note: "Máximo 10 participantes",
          value: "Presencial exclusivo",
        },
      ],
      next: "Próxima sessão",
      soldOut: "Esgotado",
      title: "Logística",
      toBeAnnounced: "A anunciar",
    },
    faq: {
      description:
        "Aqui estão as mais comuns. Para tudo o resto, escreva-nos ou agende uma chamada.",
      items: [
        {
          answer:
            "Vai aprender o essencial sobre Bitcoin de forma simples e prática: como funciona, como comprar, como guardar em auto-custódia e como usar no dia a dia. A formação inclui 3 workshops práticos.",
          question: "O que vou aprender na formação Bitcoin para Todos?",
        },
        {
          answer:
            "A formação custa 200 € (IVA incluído) para particulares. Empresas e organizações podem contactar-nos para uma proposta personalizada.",
          question: "Qual é o preço da formação?",
        },
        {
          answer:
            "A formação tem a duração de 8 horas (dia inteiro), em formato presencial exclusivo, com um máximo de 10 participantes.",
          question: "Qual é a duração da formação?",
        },
        {
          answer:
            "Sim. No final do curso recebe um certificado de formação emitido pelo Instituto Português de Bitcoin.",
          question: "Recebo certificado no final?",
        },
      ],
      title: "Tem dúvidas?",
    },
    goal: {
      closing:
        "E sobretudo continuar acompanhado pelo IPB através da nossa comunidade digital, com acesso contínuo a pessoas, partilha de conhecimento, eventos e apoio ao longo do seu percurso.",
      intro: "Mais do que aprender conceitos, é importante:",
      items: [
        "Sentir-se confiante para utilizar Bitcoin de forma autónoma",
        "Evitar erros comuns e perdas desnecessárias",
        "Proteger o seu dinheiro com segurança",
      ],
      title: "O verdadeiro objetivo",
    },
    heroAlt: "Curso Bitcoin para Todos",
    included: [
      {
        alt: "Folheto de boas práticas de auto-custódia",
        height: 1134,
        src: "/folheto.jpeg",
        text: [
          "Vai receber um folheto prático com um guia claro para guardar as suas palavras-chave com segurança, evitar perdas irreversíveis e seguir boas práticas de auto-custódia.",
        ],
        title: "Recursos incluídos",
        width: 1600,
      },
      {
        alt: "Certificado de formação",
        height: 1129,
        src: "/diploma.jpeg",
        text: [
          "No final do curso receberá um ",
          "certificado de formação",
          " emitido pelo Instituto Português de Bitcoin.",
        ],
        title: "Certificado de Formação",
        width: 1600,
      },
    ],
    lead: "A Bitcoin é o futuro do dinheiro. Quem mais cedo a compreender, mais vantagens terá.",
    learn: {
      items: [
        "O essencial sobre Bitcoin, de forma simples e prática",
        "Como proteger a sua privacidade e soberania financeira",
        "Como comprar, guardar e utilizar Bitcoin em segurança",
      ],
      title: "O que vai aprender",
    },
    program: {
      cta: "Garanta o seu lugar no próximo curso.",
      eyebrow: "3 workshops práticos",
      modules: [
        {
          title: "A Génese",
          topics: [
            "Breve História do dinheiro",
            "O problema é inflação",
            "A solução é Bitcoin",
            "A descoberta da escassez digital",
          ],
          workshop: {
            description: "Como comprar Bitcoin com segurança",
            label: "Workshop #1",
            motto: "Don't trust. Verify!",
          },
        },
        {
          title: "A Tecnologia",
          topics: [
            "A blockchain",
            "A mineração",
            "Bitcoin não é Cripto",
            "Carteiras Bitcoin",
            "FUD — Medos, incertezas e dúvidas",
            "A rede Lightning",
          ],
          workshop: {
            description: "Como guardar Bitcoin em auto-custódia",
            label: "Workshop #2",
            motto: "Not your keys. Not your coins!",
          },
        },
        {
          title: "A Revolução",
          topics: [
            "Instrumento de liberdade",
            "Enquadramento regulamentar",
            "Oportunidades para indivíduos e empresas",
          ],
          workshop: {
            description: "Como usar Bitcoin no dia a dia",
            label: "Workshop #3",
            motto: "Fix the money. Fix the world!",
          },
        },
      ],
      summary: "200 € · 8 horas · Presencial",
      title: "Programa",
    },
    register: "Inscrever-se",
    title: "Bitcoin para Todos",
    trainers: {
      people: [
        {
          details: [
            "Ex-Diretor e Vice-Presidente na Veolia",
            "Pós-graduação MIT Portugal e Licenciatura em Eng.ª Mecânica no Instituto Superior Técnico",
          ],
          image: "/formador_antonio.jpeg",
          name: "António Neves da Silva",
          role: "Fundador da MoT Inteligência Energética",
        },
        {
          details: [
            "Engenheiro de Software na Mindera",
            "Mestrado em Ciência de Computadores (IA) na Faculdade de Engenharia da Universidade do Porto",
          ],
          image: "/formador_tomas.JPG",
          name: "Tomás Mamede",
          role: "Presidente da Assembleia Geral do Instituto Português de Bitcoin",
        },
      ],
      title: "Os Formadores",
    },
  },
};
const content = computed(() => CONTENT[appLocale.value]);

const SEO = {
  en: {
    description:
      "In-person Bitcoin training in one day: learn to buy, store and use Bitcoin safely, with 3 practical workshops and a certificate.",
    title: "Bitcoin for Everyone — Training",
  },
  pt: {
    description:
      "Formação presencial de um dia sobre Bitcoin: aprenda a comprar, guardar e usar Bitcoin em segurança, com 3 workshops práticos e certificado.",
    title: "Bitcoin para Todos — Formação",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.title} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.title} | IPB`,
});

useShareImage({ alt: content.value.heroAlt, url: absoluteUrl("/curso.jpeg") });

// Awaited rather than lazy: the form needs the dates on first paint, and the
// structured data below lists them while the page renders on the server.
// Only sessions still to come are offered, soonest first.
const { data: sessions, error } = await useAsyncData(
  `trainings-${locale.value}`,
  async () => {
    const list = await convex.query(api.trainings.listActive, {
      locale: appLocale.value,
    });
    const now = Date.now();
    return list
      .filter((session) => Date.parse(session.start_date) > now)
      .toSorted((a, b) => Date.parse(a.start_date) - Date.parse(b.start_date));
  },
  { default: () => [] }
);
// The rest of the page is static, so it still renders; the form says why
// there are no dates.
const unavailable = computed(() => Boolean(error.value));

const nextOpenSession = computed(() =>
  sessions.value.find((session) => session.stock_left > 0)
);

/** Sessions run in Lisbon; a fixed zone also keeps server and client in step. */
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(
    appLocale.value === "pt" ? "pt-PT" : "en-GB",
    {
      day: "numeric",
      month: "long",
      timeZone: "Europe/Lisbon",
      year: "numeric",
    }
  );
}

const facts = computed(() => {
  const { items, next, soldOut, toBeAnnounced } = content.value.facts;
  const session = nextOpenSession.value;
  const nextFact = session
    ? {
        label: next,
        note: session.location,
        value: formatDay(session.start_date),
      }
    : {
        label: next,
        note: "",
        value: sessions.value.length ? soldOut : toBeAnnounced,
      };
  return [nextFact, ...items];
});

// ── Structured data ─────────────────────────────────────────────────────────
// nuxt-schema-org resolves the Course's provider (the institute) but not the
// offer or the sessions nested in it, so those carry full types and URLs.
const pageUrl = absoluteUrl(localePath("formacoes"));

const instructors = content.value.trainers.people.map((trainer) => ({
  "@id": personSchemaId(nameToSlug(trainer.name)),
}));
const venue = {
  "@type": "Place",
  address: { "@type": "PostalAddress", addressCountry: "PT" },
};

let availability: string | undefined;
if (sessions.value.length > 0) {
  availability = nextOpenSession.value
    ? "https://schema.org/InStock"
    : "https://schema.org/SoldOut";
}

useSchemaOrg([
  defineWebPage({ "@type": "FAQPage" }),
  defineBreadcrumb({
    itemListElement: [
      { item: localePath("index"), name: t("seo.title") },
      { item: localePath("formacoes"), name: t("nav.training") },
    ],
  }),
  defineCourse({
    description: content.value.course.description,
    // Without dates on sale, the course is still described as onsite.
    hasCourseInstance:
      sessions.value.length > 0
        ? sessions.value.map((session) => ({
            "@type": "CourseInstance",
            courseMode: "onsite",
            courseWorkload: "PT8H",
            endDate: session.end_date ?? undefined,
            instructor: instructors,
            location: { ...venue, name: session.location },
            startDate: session.start_date,
          }))
        : [
            {
              "@type": "CourseInstance",
              courseMode: "onsite",
              courseWorkload: "PT8H",
              instructor: instructors,
              location: venue,
            },
          ],
    image: absoluteUrl("/curso.jpeg"),
    inLanguage: appLocale.value === "pt" ? "pt-PT" : "en-US",
    name: content.value.title,
    offers: {
      "@type": "Offer",
      availability,
      category: "Paid",
      price: "200",
      priceCurrency: "EUR",
      url: pageUrl,
    },
    teaches: content.value.course.teaches,
    url: pageUrl,
  }),
  ...content.value.trainers.people.map((trainer) =>
    definePerson({
      "@id": personSchemaId(nameToSlug(trainer.name)),
      image: absoluteUrl(trainer.image),
      jobTitle: trainer.role,
      name: trainer.name,
      worksFor: { "@id": identitySchemaId() },
    })
  ),
  ...content.value.faq.items.map((item) =>
    defineQuestion({ acceptedAnswer: item.answer, name: item.question })
  ),
]);
</script>
