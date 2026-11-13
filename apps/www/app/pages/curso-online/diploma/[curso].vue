<template>
  <div v-if="course">
    <!-- Everything outside the diploma is hidden when printing. -->
    <div class="no-print">
      <IPBPageHeader
        :eyebrow="copy.eyebrow"
        :title="copy.title"
        :description="
          state === 'locked'
            ? copy.locked(progress?.completed.length ?? 0, progress?.total ?? 0)
            : copy.description
        "
      >
        <template #before>
          <NuxtLink
            :to="
              localePath({
                name: 'curso-online-curso',
                params: { curso: course.slug },
              })
            "
            class="link inline-flex text-sm text-neutral-600"
          >
            ← {{ course.title[lang] }}
          </NuxtLink>
        </template>
      </IPBPageHeader>
    </div>

    <section class="section pt-10 pb-24">
      <div v-if="state === 'loading'" class="no-print text-neutral-500">…</div>

      <div
        v-else-if="state === 'anonymous'"
        class="no-print flex flex-wrap gap-3"
      >
        <UiButton arrow :to="localePath('curso-online-entrar')">{{
          copy.signIn
        }}</UiButton>
      </div>

      <div
        v-else-if="state === 'notOwned'"
        class="no-print flex flex-wrap gap-3"
      >
        <UiButton
          arrow
          :to="
            localePath({
              name: 'curso-online-curso',
              params: { curso: course.slug },
            })
          "
        >
          {{ copy.seeCourse }}
        </UiButton>
      </div>

      <div v-else-if="state === 'locked'" class="no-print flex flex-wrap gap-3">
        <UiButton
          arrow
          :to="
            localePath({
              name: 'curso-online-curso',
              params: { curso: course.slug },
            })
          "
        >
          {{ copy.continue }}
        </UiButton>
      </div>

      <template v-else>
        <form
          class="no-print mb-10 flex max-w-xl flex-col gap-3"
          novalidate
          @submit.prevent="issue"
        >
          <label for="diploma-name" class="text-sm font-medium">{{
            copy.nameLabel
          }}</label>
          <div class="flex flex-wrap gap-3">
            <input
              id="diploma-name"
              v-model="name"
              class="field-box min-w-0 flex-1"
              autocomplete="name"
              maxlength="80"
              :placeholder="copy.namePlaceholder"
            />
            <UiButton
              type="submit"
              :loading="busy"
              :disabled="busy || name.trim().length < 2"
            >
              {{ diploma ? copy.update : copy.issue }}
            </UiButton>
          </div>
          <p class="text-xs text-neutral-500">{{ copy.nameHint }}</p>
          <p v-if="error" class="text-sm text-red-700" role="alert">
            {{ error }}
          </p>
        </form>

        <article
          v-if="diploma"
          class="diploma relative mx-auto flex aspect-[1.414/1] w-full max-w-5xl flex-col items-center justify-between overflow-hidden rounded-2xl bg-white p-6 text-center shadow-border sm:p-12"
          :aria-label="copy.title"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-3 rounded-xl border border-black/15 sm:inset-5"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-4 rounded-lg border-2 border-brand sm:inset-7"
          />

          <div class="relative flex flex-col items-center gap-3">
            <IPBLogo class="h-9 w-auto sm:h-14" />
            <p class="eyebrow">{{ copy.diplomaOf }}</p>
          </div>

          <div class="relative flex flex-col items-center gap-3 sm:gap-5">
            <p class="text-xs text-neutral-600 sm:text-lg">
              {{ copy.certifies }}
            </p>
            <p
              class="text-3xl leading-tight font-normal tracking-[-0.03em] text-balance sm:text-6xl"
            >
              {{ diploma.name }}
            </p>
            <p
              class="max-w-2xl text-xs text-pretty text-neutral-600 sm:text-lg"
            >
              {{ sentence }}
            </p>
          </div>

          <div
            class="relative flex w-full flex-wrap items-end justify-between gap-3 text-left font-mono text-[9px] text-neutral-500 sm:text-xs"
          >
            <div>
              <p>{{ copy.date }}</p>
              <p class="text-neutral-950">
                {{ formatDate(diploma.issuedAt ?? Date.now(), lang) }}
              </p>
            </div>
            <div class="text-right">
              <p>{{ copy.verify }}</p>
              <p class="text-neutral-950">{{ diploma.code }}</p>
              <p>{{ verifyUrl }}</p>
            </div>
          </div>
        </article>

        <div v-if="diploma" class="no-print mt-8 flex flex-wrap gap-3">
          <UiButton size="lg" @click="print">{{ copy.print }}</UiButton>
          <UiButton
            size="lg"
            variant="outline"
            :to="
              localePath({
                name: 'curso-online-verificar-codigo',
                params: { codigo: diploma.code },
              })
            "
          >
            {{ copy.verifyPage }}
          </UiButton>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const lang = useAppLocale();
const localePath = useLocalePath();
const slug = String(route.params.curso);

const course = ONLINE_COURSES.find((c) => c.slug === slug);
if (!course) {
  throw createError({
    fatal: true,
    statusCode: 404,
    statusMessage: "Not found",
  });
}

const COPY = {
  en: {
    certifies: "The Portuguese Bitcoin Institute certifies that",
    completed: (n: number, title: string, hours: number) =>
      `completed the online course ${n}. ${title} (${hours} hours of self-paced study)`,
    continue: "Go back to the lessons",
    date: "Issued on",
    description:
      "Write your name as you want it on the diploma. You can print it or save it as a PDF.",
    diplomaOf: "Diploma",
    eyebrow: "Online courses",
    issue: "Create diploma",
    locked: (done: number, total: number) =>
      `The diploma opens when every lesson is marked as done (${done} of ${total} so far).`,
    nameHint:
      "Use your full name. You can change it later; the code stays the same.",
    nameLabel: "Name on the diploma",
    namePlaceholder: "Your full name",
    print: "Print or save as PDF",
    seeCourse: "See the course",
    signIn: "Sign in",
    title: "Your diploma",
    update: "Update name",
    verify: "Verification code",
    verifyPage: "Open verification page",
  },
  pt: {
    certifies: "O Instituto Português de Bitcoin certifica que",
    completed: (n: number, title: string, hours: number) =>
      `concluiu o curso online ${n}. ${title} (${hours} horas de autoestudo)`,
    continue: "Voltar às lições",
    date: "Emitido em",
    description:
      "Escrever o nome como deve aparecer no diploma. É possível imprimi-lo ou guardá-lo em PDF.",
    diplomaOf: "Diploma",
    eyebrow: "Cursos online",
    issue: "Criar diploma",
    locked: (done: number, total: number) =>
      `O diploma abre quando todas as lições estiverem marcadas como concluídas (por agora, ${done} de ${total}).`,
    nameHint:
      "Usar o nome completo. É possível alterá-lo depois; o código mantém-se.",
    nameLabel: "Nome no diploma",
    namePlaceholder: "Nome completo",
    print: "Imprimir ou guardar em PDF",
    seeCourse: "Ver o curso",
    signIn: "Entrar",
    title: "Diploma",
    update: "Atualizar nome",
    verify: "Código de verificação",
    verifyPage: "Abrir a página de verificação",
  },
} as const;
const copy = computed(() => ({
  ...COPY[lang.value],
  ...COURSE_COPY[lang.value],
}));

// "...concluiu o curso online 2. A Tecnologia (3 horas de autoestudo). Conteúdo: ..."
const sentence = computed(() => {
  const main = `${copy.value.completed(course.number, course.title[lang.value], course.hours)}.`;
  return lang.value === "pt"
    ? `${main} Conteúdo: ${course.diplomaTopic.pt}.`
    : main;
});

const { account, pending, progressOf, refresh } = useCourseAccount();
const progress = computed(() => progressOf(slug));
const diploma = computed(() => progress.value?.diploma ?? null);

const state = computed(() => {
  if (pending.value && !account.value.email) {
    return "loading";
  }
  if (!account.value.email) {
    return "anonymous";
  }
  if (!progress.value) {
    return "notOwned";
  }
  return progress.value.completed.length === progress.value.total
    ? "ready"
    : "locked";
});

const name = ref("");
const busy = ref(false);
const error = ref("");
watchEffect(() => {
  if (!name.value && diploma.value?.name) {
    name.value = diploma.value.name;
  }
});

const origin = useRequestURL().origin;
const verifyUrl = computed(() =>
  diploma.value
    ? `${origin}${localePath({ name: "curso-online-verificar-codigo", params: { codigo: diploma.value.code } })}`
    : ""
);

async function issue() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/curso/diploma", {
      body: { course: slug, name: name.value },
      method: "POST",
    });
    await refresh();
  } catch {
    error.value = COURSE_COPY[lang.value].genericError;
  } finally {
    busy.value = false;
  }
}

function print() {
  window.print();
}

// Print only the diploma, on a landscape A4 page.
useHead({ htmlAttrs: { class: "print-diploma" } });
useSeoMeta({ robots: "noindex, nofollow", title: () => copy.value.title });
</script>

<style>
@media print {
  @page {
    margin: 0;
    size: A4 landscape;
  }
  html.print-diploma header,
  html.print-diploma footer,
  html.print-diploma .no-print {
    display: none !important;
  }
  html.print-diploma .diploma {
    aspect-ratio: auto;
    border-radius: 0;
    box-shadow: none;
    height: 100vh;
    max-width: none;
    padding: 3rem;
    width: 100vw;
  }
  html.print-diploma body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
