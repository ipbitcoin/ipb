<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="title"
      :description="description"
    />
    <section v-if="result?.valid" class="section pt-10 pb-24">
      <dl
        class="grid max-w-xl gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
      >
        <div>
          <dt class="eyebrow">{{ copy.name }}</dt>
          <dd class="mt-1 text-2xl tracking-[-0.02em]">{{ result.name }}</dd>
        </div>
        <div>
          <dt class="eyebrow">{{ copy.course }}</dt>
          <dd class="mt-1">{{ courseTitle }}</dd>
        </div>
        <div>
          <dt class="eyebrow">{{ copy.date }}</dt>
          <dd class="mt-1">{{ formatDate(result.issuedAt, lang) }}</dd>
        </div>
        <div>
          <dt class="eyebrow">{{ copy.code }}</dt>
          <dd class="mt-1 font-mono">{{ result.code }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const lang = useAppLocale();
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
    code: "Code",
    course: "Course",
    date: "Issued on",
    eyebrow: "Diploma verification",
    invalid: "Diploma not found",
    invalidText:
      "We found no diploma with this code. Check that it was typed correctly.",
    name: "Name",
    valid: "Valid diploma",
    validText: "This diploma was issued by the Portuguese Bitcoin Institute.",
  },
  pt: {
    code: "Código",
    course: "Curso",
    date: "Emitido em",
    eyebrow: "Verificação de diploma",
    invalid: "Diploma não encontrado",
    invalidText:
      "Não encontrámos nenhum diploma com este código. Convém confirmar se foi escrito corretamente.",
    name: "Nome",
    valid: "Diploma válido",
    validText: "Este diploma foi emitido pelo Instituto Português de Bitcoin.",
  },
} as const;
const copy = computed(() => COPY[lang.value]);
const title = computed(() =>
  result.value ? copy.value.valid : copy.value.invalid
);
const description = computed(() =>
  result.value ? copy.value.validText : copy.value.invalidText
);
const courseTitle = computed(() => {
  const course = ONLINE_COURSES.find(
    (c) => c.slug === result.value?.courseSlug
  );
  return course ? `${course.number}. ${course.title[lang.value]}` : "";
});

useSeoMeta({ robots: "noindex, nofollow", title: () => title.value });
</script>
