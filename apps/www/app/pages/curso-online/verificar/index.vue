<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="copy.title"
      :description="copy.description"
    >
      <template #before>
        <NuxtLink
          :to="localePath('curso-online')"
          class="link inline-flex items-center gap-2 text-sm text-neutral-600"
        >
          ← {{ copy.back }}
        </NuxtLink>
      </template>
    </IPBPageHeader>

    <section class="section pt-10 pb-24">
      <form
        class="flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-6 shadow-border sm:p-7"
        novalidate
        @submit.prevent="check"
      >
        <label for="verify-code" class="text-sm font-medium">{{
          copy.label
        }}</label>
        <div class="flex flex-wrap gap-3">
          <input
            id="verify-code"
            v-model="code"
            class="field-box min-w-0 flex-1 font-mono uppercase"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="IPB-C1-XXXX-XXXX"
            :aria-invalid="Boolean(error)"
            :aria-describedby="error ? 'verify-error' : 'verify-hint'"
          />
          <UiButton type="submit" :disabled="!code.trim()">
            {{ copy.check }}
          </UiButton>
        </div>
        <p
          v-if="error"
          id="verify-error"
          class="text-sm text-red-700"
          role="alert"
        >
          {{ error }}
        </p>
        <p v-else id="verify-hint" class="text-xs text-neutral-500">
          {{ copy.hint }}
        </p>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
const lang = useAppLocale();
const localePath = useLocalePath();

const COPY = {
  en: {
    back: "All online courses",
    check: "Check",
    description:
      "Every diploma has a code. Type it here to confirm that the Portuguese Bitcoin Institute issued it, and to see the name, the course and the date.",
    eyebrow: "Diploma verification",
    hint: "The code is at the bottom right of the diploma. It looks like IPB-C1-ABCD-EFGH.",
    invalid:
      "That does not look like a diploma code. It has the form IPB-C1-ABCD-EFGH.",
    label: "Diploma code",
    title: "Check a diploma",
  },
  pt: {
    back: "Todos os cursos online",
    check: "Verificar",
    description:
      "Cada diploma tem um código. Escrevê-lo aqui confirma que foi emitido pelo Instituto Português de Bitcoin e mostra o nome, o curso e a data.",
    eyebrow: "Verificação de diploma",
    hint: "O código está no canto inferior direito do diploma. Tem a forma IPB-C1-ABCD-EFGH.",
    invalid:
      "Isto não parece um código de diploma. Tem a forma IPB-C1-ABCD-EFGH.",
    label: "Código do diploma",
    title: "Verificar um diploma",
  },
} as const;
const copy = computed(() => COPY[lang.value]);

const code = ref("");
const error = ref("");

async function check() {
  const normalized = normalizeDiplomaCode(code.value);
  if (!normalized) {
    error.value = copy.value.invalid;
    return;
  }
  error.value = "";
  await navigateTo(
    localePath({
      name: "curso-online-verificar-codigo",
      params: { codigo: normalized },
    })
  );
}

useSeoMeta({ title: () => copy.value.title, description: () => copy.value.description });
</script>
