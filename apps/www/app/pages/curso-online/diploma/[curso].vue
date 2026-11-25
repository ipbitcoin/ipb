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

    <section class="dp-section section pt-10 pb-24">
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

      <div
        v-else-if="state === 'locked'"
        class="no-print grid max-w-xl gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
      >
        <p class="eyebrow">{{ copy.progressLabel }}</p>
        <div class="flex flex-col gap-2">
          <p class="text-3xl font-normal tracking-[-0.03em]">{{ percent }}%</p>
          <div class="h-1.5 overflow-hidden rounded-full bg-black/8">
            <div class="h-full bg-brand" :style="{ width: `${percent}%` }" />
          </div>
          <p class="text-sm text-neutral-600">
            {{ copy.remaining(remaining) }}
          </p>
        </div>
        <div>
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
      </div>

      <template v-else>
        <form
          class="no-print mx-auto mb-10 flex w-full max-w-5xl flex-col gap-3 rounded-2xl bg-white p-6 shadow-border sm:p-7"
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

        <div v-if="diploma" class="dp-frame">
          <article class="dp-sheet" :aria-label="copy.title">
            <div class="dp-guilloche" aria-hidden="true" />
            <div class="dp-line dp-line-outer" aria-hidden="true" />
            <div class="dp-line dp-line-inner" aria-hidden="true" />
            <span class="dp-corner dp-tl" aria-hidden="true" />
            <span class="dp-corner dp-tr" aria-hidden="true" />
            <span class="dp-corner dp-bl" aria-hidden="true" />
            <span class="dp-corner dp-br" aria-hidden="true" />

            <header class="dp-head">
              <IPBLogo class="dp-logo" />
              <p class="dp-eyebrow">{{ copy.certificate }}</p>
            </header>

            <div class="dp-body">
              <p class="dp-lead">{{ copy.certifies }}</p>
              <p class="dp-name" :style="{ '--dp-name': nameSize }">
                {{ diploma.name }}
              </p>
              <span class="dp-rule" aria-hidden="true" />
              <p class="dp-lead">{{ copy.completedLead }}</p>
              <p class="dp-course-n">{{ copy.courseLabel(course.number) }}</p>
              <p class="dp-course">{{ course.title[lang] }}</p>
              <p class="dp-topic">{{ copy.topic(course.diplomaTopic[lang]) }}</p>
              <p class="dp-hours">{{ hoursLine }}</p>
            </div>

            <footer class="dp-foot">
              <div class="dp-fact">
                <p class="dp-label">{{ copy.date }}</p>
                <p class="dp-value">{{ issuedDate }}</p>
              </div>

              <svg
                class="dp-seal"
                viewBox="0 0 100 100"
                role="img"
                :aria-label="copy.sealLabel"
              >
                <defs>
                  <path
                    :id="`dp-arc-top-${course.number}`"
                    d="M16.64 62.14 A35.5 35.5 0 1 1 83.36 62.14"
                  />
                  <path
                    :id="`dp-arc-bottom-${course.number}`"
                    d="M11.47 64.02 A41 41 0 0 0 88.53 64.02"
                  />
                </defs>
                <circle cx="50" cy="50" r="48" fill="#fff" stroke="#f29500" stroke-width="1.6" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="#f29500" stroke-width="0.5" />
                <circle cx="50" cy="50" r="27.5" fill="#fef3e2" stroke="#f29500" stroke-width="0.8" />
                <text class="dp-seal-text" text-anchor="middle">
                  <textPath :href="`#dp-arc-top-${course.number}`" startOffset="50%">
                    {{ copy.sealTop }}
                  </textPath>
                </text>
                <text class="dp-seal-text" text-anchor="middle">
                  <textPath :href="`#dp-arc-bottom-${course.number}`" startOffset="50%">
                    {{ copy.sealBottom(course.number) }}
                  </textPath>
                </text>
                <circle cx="11.5" cy="50" r="1.5" fill="#f29500" />
                <circle cx="88.5" cy="50" r="1.5" fill="#f29500" />
                <g transform="translate(42 37) scale(0.2)">
                  <path
                    fill="#f29500"
                    d="M35.085 0.535156C54.1499 0.535156 69.605 15.9907 69.605 35.0557C69.605 46.2526 64.2729 56.2026 56.0107 62.5098C69.65 67.121 79.468 80.024 79.468 95.22C79.468 114.285 64.013 129.74 44.9482 129.74H23.249V62.6719H0.535156V0.535156H35.085Z"
                  />
                </g>
              </svg>

              <div class="dp-fact dp-fact-end">
                <p class="dp-label">{{ copy.verify }}</p>
                <p class="dp-value dp-code">{{ diploma.code }}</p>
                <p class="dp-url">{{ verifyUrlShort }}</p>
              </div>
            </footer>
          </article>
        </div>

        <div
          v-if="diploma"
          class="no-print mx-auto mt-8 flex w-full max-w-5xl flex-wrap gap-3"
        >
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
          <UiButton size="lg" variant="outline" @click="copyLink">
            {{ copied ? copy.copied : copy.copyLink }}
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
    certificate: "Certificate of completion",
    certifies: "The Portuguese Bitcoin Institute certifies that",
    completedLead: "has completed the online course",
    continue: "Go back to the lessons",
    copied: "Link copied",
    copyLink: "Copy the verification link",
    courseLabel: (n: number) => `Online course ${n}`,
    date: "Issued on",
    description:
      "Write your name as you want it on the diploma. You can print it or save it as a PDF.",
    eyebrow: "Online courses",
    hoursLine: (hours: string) => `${hours} of self-paced study`,
    issue: "Create diploma",
    locked: (done: number, total: number) =>
      `The diploma opens when every lesson is marked as done (${done} of ${total} so far).`,
    nameHint:
      "Use your full name. You can change it later; the code stays the same.",
    nameLabel: "Name on the diploma",
    namePlaceholder: "Your full name",
    print: "Print or save as PDF",
    progressLabel: "Your progress",
    remaining: (n: number) =>
      n === 1 ? "1 lesson left." : `${n} lessons left.`,
    sealLabel: "Seal of the Portuguese Bitcoin Institute",
    sealBottom: (n: number) => `Online course ${n}`,
    sealTop: "Portuguese Bitcoin Institute",
    seeCourse: "See the course",
    signIn: "Sign in",
    title: "Your diploma",
    topic: (topic: string) => `The course covered ${topic}.`,
    update: "Update name",
    verify: "Verification code",
    verifyPage: "Open verification page",
  },
  pt: {
    certificate: "Certificado de conclusão",
    certifies: "O Instituto Português de Bitcoin certifica que",
    completedLead: "concluiu o curso online",
    continue: "Voltar às lições",
    copied: "Ligação copiada",
    copyLink: "Copiar a ligação de verificação",
    courseLabel: (n: number) => `Curso online ${n}`,
    date: "Emitido em",
    description:
      "Escrever o nome como deve aparecer no diploma. É possível imprimi-lo ou guardá-lo em PDF.",
    eyebrow: "Cursos online",
    hoursLine: (hours: string) => `${hours} de autoestudo`,
    issue: "Criar diploma",
    locked: (done: number, total: number) =>
      `O diploma abre quando todas as lições estiverem marcadas como concluídas (por agora, ${done} de ${total}).`,
    nameHint:
      "Usar o nome completo. É possível alterá-lo depois; o código mantém-se.",
    nameLabel: "Nome no diploma",
    namePlaceholder: "Nome completo",
    print: "Imprimir ou guardar em PDF",
    progressLabel: "O progresso",
    remaining: (n: number) =>
      n === 1 ? "Falta 1 lição." : `Faltam ${n} lições.`,
    sealLabel: "Selo do Instituto Português de Bitcoin",
    sealBottom: (n: number) => `Curso online ${n}`,
    sealTop: "Instituto Português de Bitcoin",
    seeCourse: "Ver o curso",
    signIn: "Entrar",
    title: "Diploma",
    topic: (topic: string) => `O curso abrangeu ${topic}.`,
    update: "Atualizar nome",
    verify: "Código de verificação",
    verifyPage: "Abrir a página de verificação",
  },
} as const;
const copy = computed(() => ({
  ...COURSE_COPY[lang.value],
  ...COPY[lang.value],
}));

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
  // A diploma that was already issued stays visible when lessons are added.
  if (progress.value.diploma) {
    return "ready";
  }
  return progress.value.completed.length === progress.value.total
    ? "ready"
    : "locked";
});

const remaining = computed(() =>
  progress.value
    ? Math.max(0, progress.value.total - progress.value.completed.length)
    : 0
);
const percent = computed(() =>
  progress.value?.total
    ? Math.round((progress.value.completed.length / progress.value.total) * 100)
    : 0
);

const name = ref("");
const busy = ref(false);
const error = ref("");
watchEffect(() => {
  if (!name.value && diploma.value?.name) {
    name.value = diploma.value.name;
  }
});

// A long name is set smaller so it keeps to one or two lines.
const nameSize = computed(() => {
  const length = diploma.value?.name?.length ?? 0;
  if (length <= 22) {
    return 5.6;
  }
  if (length <= 34) {
    return 4.5;
  }
  if (length <= 50) {
    return 3.6;
  }
  return 2.9;
});

const hoursLine = computed(() => {
  const hours = copy.value.hours(course.hours);
  return copy.value.hoursLine(hours.charAt(0).toUpperCase() + hours.slice(1));
});
const issuedDate = computed(() =>
  diploma.value?.issuedAt ? formatDate(diploma.value.issuedAt, lang.value) : ""
);

const origin = useRequestURL().origin;
const verifyUrl = computed(() =>
  diploma.value
    ? `${origin}${localePath({ name: "curso-online-verificar-codigo", params: { codigo: diploma.value.code } })}`
    : ""
);
const verifyUrlShort = computed(() => verifyUrl.value.replace(/^https?:\/\//, ""));

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

const copied = ref(false);
async function copyLink() {
  try {
    await navigator.clipboard.writeText(verifyUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // No clipboard access: the link is still on the diploma and on its page.
  }
}

// Print only the diploma, on a landscape A4 page.
useHead({ htmlAttrs: { class: "print-diploma" } });
useSeoMeta({ robots: "noindex, nofollow", title: () => copy.value.title });
</script>

<style>
/*
 * The diploma is drawn in units of 1% of its own width (cqw), so it looks the
 * same at any size: on a phone, on a desktop and printed on A4 landscape.
 * On narrow screens it becomes a taller sheet with larger type (--k).
 */
.dp-frame {
  container-type: inline-size;
  margin-inline: auto;
  max-width: 64rem;
  width: 100%;
}
.dp-sheet {
  --k: 1;
  --u: calc(var(--k) * 1cqw);
  aspect-ratio: 1.414 / 1;
  background: #fff;
  border-radius: calc(var(--u) * 1.2);
  box-shadow:
    0 0 0 1px oklch(0 0 0 / 0.06),
    0 24px 60px -24px oklch(0 0 0 / 0.28);
  color: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: calc(var(--u) * 6.4) calc(var(--u) * 7.2) calc(var(--u) * 5.2);
  position: relative;
  text-align: center;
}
.dp-sheet > * {
  position: relative;
}

/* Watermark of fine concentric lines, faded out behind the text. */
.dp-guilloche {
  background: repeating-radial-gradient(
    circle at 50% 50%,
    transparent 0 calc(var(--u) * 1),
    rgb(242 149 0 / 0.1) calc(var(--u) * 1) calc(var(--u) * 1.12)
  );
  inset: calc(var(--u) * 2.6);
  mask-image: radial-gradient(ellipse at 50% 50%, transparent 30%, #000 100%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 50%, transparent 30%, #000 100%);
  position: absolute !important;
}
.dp-line {
  inset: calc(var(--u) * 1.8);
  pointer-events: none;
  position: absolute !important;
}
.dp-line-outer {
  border: calc(var(--u) * 0.1) solid rgb(0 0 0 / 0.22);
  border-radius: calc(var(--u) * 0.8);
}
.dp-line-inner {
  border: calc(var(--u) * 0.22) solid #f29500;
  border-radius: calc(var(--u) * 0.5);
  inset: calc(var(--u) * 2.6);
}
.dp-corner {
  background: #f29500;
  height: calc(var(--u) * 1);
  position: absolute !important;
  width: calc(var(--u) * 1);
}
.dp-tl { left: calc(var(--u) * 2.1); top: calc(var(--u) * 2.1); }
.dp-tr { right: calc(var(--u) * 2.1); top: calc(var(--u) * 2.1); }
.dp-bl { bottom: calc(var(--u) * 2.1); left: calc(var(--u) * 2.1); }
.dp-br { bottom: calc(var(--u) * 2.1); right: calc(var(--u) * 2.1); }

.dp-head {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 1.4);
}
.dp-logo {
  height: calc(var(--u) * 6);
  width: auto;
}
.dp-eyebrow,
.dp-course-n,
.dp-hours,
.dp-label {
  font-family: var(--font-mono);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.dp-eyebrow {
  align-items: center;
  color: #525252;
  display: inline-flex;
  font-size: calc(var(--u) * 0.95);
  gap: calc(var(--u) * 0.8);
}
.dp-eyebrow::before {
  background: #f29500;
  content: "";
  height: calc(var(--u) * 0.5);
  width: calc(var(--u) * 0.5);
}

.dp-body {
  align-items: center;
  display: flex;
  flex-direction: column;
}
.dp-lead {
  color: #525252;
  font-size: calc(var(--u) * 1.5);
}
.dp-name {
  font-size: calc(var(--u) * var(--dp-name, 5.6));
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1.08;
  margin: calc(var(--u) * 1.1) 0 calc(var(--u) * 0.9);
  max-width: calc(var(--u) * 78);
  text-wrap: balance;
}
.dp-rule {
  background: #f29500;
  height: calc(var(--u) * 0.25);
  margin-bottom: calc(var(--u) * 1.3);
  width: calc(var(--u) * 16);
}
.dp-course-n {
  color: #737373;
  font-size: calc(var(--u) * 0.95);
  margin-top: calc(var(--u) * 1.1);
}
.dp-course {
  font-size: calc(var(--u) * 3.6);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin-top: calc(var(--u) * 0.5);
}
.dp-topic {
  color: #525252;
  font-size: calc(var(--u) * 1.35);
  margin-top: calc(var(--u) * 1);
  max-width: calc(var(--u) * 62);
  text-wrap: pretty;
}
.dp-hours {
  color: #525252;
  font-size: calc(var(--u) * 0.95);
  letter-spacing: 0.16em;
  margin-top: calc(var(--u) * 1.2);
}

.dp-foot {
  align-items: end;
  display: grid;
  gap: calc(var(--u) * 3);
  grid-template-columns: 1fr auto 1fr;
  width: 100%;
}
.dp-fact {
  text-align: left;
}
.dp-fact-end {
  text-align: right;
}
.dp-label {
  color: #737373;
  font-size: calc(var(--u) * 0.85);
  letter-spacing: 0.16em;
}
.dp-value {
  font-size: calc(var(--u) * 1.5);
  margin-top: calc(var(--u) * 0.3);
}
.dp-code {
  font-family: var(--font-mono);
  font-size: calc(var(--u) * 1.4);
  letter-spacing: 0.06em;
}
.dp-url {
  color: #737373;
  font-family: var(--font-mono);
  font-size: calc(var(--u) * 0.8);
  margin-top: calc(var(--u) * 0.4);
  overflow-wrap: anywhere;
}
.dp-seal {
  display: block;
  height: calc(var(--u) * 13);
  width: calc(var(--u) * 13);
}
.dp-seal-text {
  fill: #8a5200;
  font-family: var(--font-mono);
  font-size: 6.6px;
  font-weight: 600;
  letter-spacing: 0.45px;
  text-transform: uppercase;
}

/* Narrow screens: a taller sheet with larger type, stacked at the bottom. */
@container (max-width: 560px) {
  .dp-sheet {
    --k: 1.9;
    aspect-ratio: auto;
    gap: calc(var(--u) * 3);
    min-height: calc(var(--u) * 72);
    padding: calc(var(--u) * 6.6) calc(var(--u) * 5.2) calc(var(--u) * 5.4);
  }
  .dp-name {
    font-size: calc(var(--u) * var(--dp-name, 5.6) * 0.78);
  }
  .dp-foot {
    gap: calc(var(--u) * 2);
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .dp-fact,
  .dp-fact-end {
    text-align: center;
  }
  .dp-foot > .dp-seal {
    order: -1;
  }
}

@media print {
  @page {
    margin: 0;
    size: A4 landscape;
  }
  html.print-diploma header:not(.dp-head),
  html.print-diploma footer:not(.dp-foot),
  html.print-diploma .no-print {
    display: none !important;
  }
  html.print-diploma .dp-section {
    padding: 0 !important;
  }
  html.print-diploma .dp-frame {
    max-width: none;
    width: 100vw;
  }
  html.print-diploma .dp-sheet {
    border-radius: 0;
    box-shadow: none;
  }
  html.print-diploma body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
