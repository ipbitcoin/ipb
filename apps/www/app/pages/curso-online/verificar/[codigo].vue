<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="title"
      :description="description"
    />

    <section class="section pt-10 pb-24">
      <article
        v-if="result"
        class="relative grid max-w-2xl gap-8 overflow-hidden rounded-2xl bg-white p-6 shadow-border sm:p-9"
      >
        <span
          aria-hidden="true"
          class="absolute inset-x-0 top-0 h-1.5 bg-brand"
        />

        <div class="flex items-center gap-4">
          <span
            class="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-950 text-white"
          >
            <IconCheck class="size-6" />
          </span>
          <p class="eyebrow">{{ copy.confirmed }}</p>
        </div>

        <div>
          <p class="eyebrow">{{ copy.name }}</p>
          <p
            class="mt-2 text-3xl leading-tight font-light tracking-[-0.03em] text-balance sm:text-4xl"
          >
            {{ result.name }}
          </p>
        </div>

        <dl class="grid gap-6 border-t border-black/10 pt-6 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <dt class="eyebrow">{{ copy.course }}</dt>
            <dd class="mt-1 text-xl tracking-[-0.02em]">{{ courseTitle }}</dd>
            <dd v-if="hoursLine" class="mt-1 text-sm text-neutral-600">
              {{ hoursLine }}
            </dd>
          </div>
          <div>
            <dt class="eyebrow">{{ copy.date }}</dt>
            <dd class="mt-1">{{ formatDate(result.issuedAt, lang) }}</dd>
          </div>
          <div>
            <dt class="eyebrow">{{ copy.code }}</dt>
            <dd class="mt-1 font-mono tracking-wide">{{ result.code }}</dd>
          </div>
        </dl>

        <div v-if="coursePage">
          <UiButton variant="outline" :to="coursePage">
            {{ copy.seeCourse }}
          </UiButton>
        </div>
      </article>

      <form
        class="mt-8 flex max-w-2xl flex-col gap-3"
        novalidate
        @submit.prevent="check"
      >
        <label for="verify-code" class="text-sm font-medium">{{
          copy.another
        }}</label>
        <div class="flex flex-wrap gap-3">
          <input
            id="verify-code"
            v-model="otherCode"
            class="field-box min-w-0 flex-1 font-mono uppercase"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="IPB-C1-XXXX-XXXX"
          />
          <UiButton type="submit" variant="outline" :disabled="!otherCode.trim()">
            {{ copy.check }}
          </UiButton>
        </div>
        <p v-if="otherError" class="text-sm text-red-700" role="alert">
          {{ otherError }}
        </p>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const lang = useAppLocale();
const localePath = useLocalePath();
const code = String(route.params.codigo ?? "").toUpperCase();

interface Result {
  code?: string;
  courseSlug?: string;
  issuedAt?: number;
  name?: string;
  valid: boolean;
}
const { data } = await useFetch<Result>(`/api/curso/verificar/${code}`);
const result = computed(() =>
  data.value?.valid && data.value.name && data.value.issuedAt
    ? {
        code: data.value.code ?? code,
        courseSlug: data.value.courseSlug,
        issuedAt: data.value.issuedAt,
        name: data.value.name,
        valid: true as const,
      }
    : null
);

const COPY = {
  en: {
    another: "Check another code",
    check: "Check",
    code: "Code",
    confirmed: "Code confirmed",
    course: "Course",
    date: "Issued on",
    eyebrow: "Diploma verification",
    invalid: "Diploma not found",
    invalid_format:
      "That does not look like a diploma code. It has the form IPB-C1-ABCD-EFGH.",
    invalidText:
      "No diploma matches this code. Check that it was typed correctly.",
    name: "Awarded to",
    seeCourse: "See the course",
    valid: "Valid diploma",
    validText: "This diploma was issued by the Portuguese Bitcoin Institute.",
  },
  pt: {
    another: "Verificar outro código",
    check: "Verificar",
    code: "Código",
    confirmed: "Código confirmado",
    course: "Curso",
    date: "Emitido em",
    eyebrow: "Verificação de diploma",
    invalid: "Diploma não encontrado",
    invalid_format:
      "Isto não parece um código de diploma. Tem a forma IPB-C1-ABCD-EFGH.",
    invalidText:
      "Nenhum diploma corresponde a este código. Convém confirmar se foi escrito corretamente.",
    name: "Atribuído a",
    seeCourse: "Ver o curso",
    valid: "Diploma válido",
    validText: "Este diploma foi emitido pelo Instituto Português de Bitcoin.",
  },
} as const;
const copy = computed(() => ({
  ...COURSE_COPY[lang.value],
  ...COPY[lang.value],
}));
const title = computed(() =>
  result.value ? copy.value.valid : copy.value.invalid
);
const description = computed(() =>
  result.value ? copy.value.validText : copy.value.invalidText
);

const course = computed(() =>
  ONLINE_COURSES.find((c) => c.slug === result.value?.courseSlug)
);
const courseTitle = computed(() =>
  course.value ? `${course.value.number}. ${course.value.title[lang.value]}` : ""
);
const hoursLine = computed(() => {
  if (!course.value) {
    return "";
  }
  const hours = copy.value.hours(course.value.hours);
  return lang.value === "en"
    ? `${hours.charAt(0).toUpperCase()}${hours.slice(1)} of self-paced study`
    : `${hours.charAt(0).toUpperCase()}${hours.slice(1)} de autoestudo`;
});
const coursePage = computed(() =>
  course.value
    ? localePath({
        name: "curso-online-curso",
        params: { curso: course.value.slug },
      })
    : ""
);

const otherCode = ref("");
const otherError = ref("");
async function check() {
  const next = normalizeDiplomaCode(otherCode.value);
  if (!next) {
    otherError.value = copy.value.invalid_format;
    return;
  }
  otherError.value = "";
  await navigateTo(
    localePath({
      name: "curso-online-verificar-codigo",
      params: { codigo: next },
    })
  );
}

useSeoMeta({ robots: "noindex, nofollow", title: () => title.value });
</script>
