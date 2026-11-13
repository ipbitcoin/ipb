<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="copy.title"
      :description="copy.description"
    />

    <section class="section pt-12 pb-24">
      <div class="max-w-md">
        <div
          v-if="account.email && !submitted"
          class="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
        >
          <p class="text-pretty">
            {{ copy.signedAs }} <strong>{{ account.email }}</strong>
          </p>
          <div class="flex flex-wrap gap-3">
            <UiButton arrow :to="localePath('curso-online')">{{
              copy.myCourses
            }}</UiButton>
            <UiButton variant="outline" @click="signOut">{{
              copy.signOut
            }}</UiButton>
          </div>
        </div>

        <form
          v-else
          class="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
          novalidate
          @submit.prevent="step === 'email' ? requestCode() : confirm()"
        >
          <div class="flex flex-col gap-1.5">
            <label for="login-email" class="text-sm font-medium">{{
              copy.email
            }}</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              class="field-box"
              :readonly="step === 'code'"
            />
          </div>

          <div v-if="step === 'code'" class="flex flex-col gap-1.5">
            <label for="login-code" class="text-sm font-medium">{{
              copy.code
            }}</label>
            <input
              id="login-code"
              v-model="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              class="field-box font-mono tracking-widest"
              autofocus
            />
            <p class="text-xs text-neutral-500">{{ copy.codeHint }}</p>
          </div>

          <p v-if="error" class="text-sm text-red-700" role="alert">
            {{ error }}
          </p>

          <UiButton
            type="submit"
            size="lg"
            arrow
            :loading="busy"
            :disabled="busy"
          >
            {{ step === "email" ? copy.sendCode : copy.signIn }}
          </UiButton>
          <button
            v-if="step === 'code'"
            type="button"
            class="link w-fit text-sm"
            @click="reset"
          >
            {{ copy.otherEmail }}
          </button>
        </form>

        <IPBDevUnlock class="mt-6" />

        <p class="mt-6 text-sm text-neutral-600">
          {{ copy.noCourse }}
          <NuxtLink :to="localePath('curso-online')" class="link font-medium">
            {{ copy.seeCourses }}
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const lang = useAppLocale();
const localePath = useLocalePath();
const route = useRoute();
const { account, refresh, signOut } = useCourseAccount();

const COPY = {
  en: {
    code: "6-digit code",
    codeHint: "We sent it to your email. It is valid for 10 minutes.",
    description:
      "Use the email you bought with. We send you a one-time code, so there is no password to remember.",
    email: "Email",
    eyebrow: "Online courses",
    invalid: "That code did not work. Check it, or ask for a new one.",
    myCourses: "My courses",
    noCourse: "Don't have a course yet?",
    otherEmail: "Use another email",
    seeCourses: "See the courses",
    sendCode: "Send me a code",
    signIn: "Sign in",
    signOut: "Sign out",
    signedAs: "You are signed in as",
    title: "Sign in",
  },
  pt: {
    code: "Código de 6 dígitos",
    codeHint: "Enviado para o email indicado. É válido durante 10 minutos.",
    description:
      "Usar o email com que foi feita a compra. É enviado um código de uso único, por isso não há palavra-passe para decorar.",
    email: "Email",
    eyebrow: "Cursos online",
    invalid: "Esse código não funcionou. Convém confirmar, ou pedir um novo.",
    myCourses: "Os meus cursos",
    noCourse: "Ainda sem curso?",
    otherEmail: "Usar outro email",
    seeCourses: "Ver os cursos",
    sendCode: "Enviar código",
    signIn: "Entrar",
    signOut: "Sair",
    signedAs: "Sessão iniciada como",
    title: "Entrar",
  },
} as const;
const copy = computed(() => ({
  ...COPY[lang.value],
  ...COURSE_COPY[lang.value],
}));

const email = ref("");
const code = ref("");
const step = ref<"email" | "code">("email");
const busy = ref(false);
const error = ref("");
const submitted = ref(false);

function reset() {
  step.value = "email";
  code.value = "";
  error.value = "";
}

async function requestCode() {
  if (!EMAIL_PATTERN.test(email.value.trim())) {
    error.value = COURSE_COPY[lang.value].wrongEmail;
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    const res = await $fetch<{ devCode?: string }>("/api/curso/entrar/pedir", {
      body: { email: email.value.trim(), locale: lang.value },
      method: "POST",
    });
    step.value = "code";
    if (res.devCode) {
      code.value = res.devCode; // local dev only
    }
  } catch {
    error.value = COURSE_COPY[lang.value].genericError;
  } finally {
    busy.value = false;
  }
}

/** Only follow a destination inside the learner area. */
function destination() {
  const next = String(route.query.proximo ?? "");
  return next.startsWith("/aula/") || next.startsWith("/curso-online")
    ? next
    : localePath("curso-online");
}

async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/curso/entrar/confirmar", {
      body: { code: code.value.trim(), email: email.value.trim() },
      method: "POST",
    });
    submitted.value = true;
    await refresh();
    // A full load: lessons are served by the server, outside the app.
    window.location.href = destination();
  } catch {
    busy.value = false;
    error.value = copy.value.invalid;
  }
}

useSeoMeta({
  robots: "noindex, nofollow",
  title: () => copy.value.title,
});
</script>
