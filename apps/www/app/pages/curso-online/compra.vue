<template>
  <div>
    <IPBPageHeader
      :eyebrow="copy.eyebrow"
      :title="state === 'error' ? copy.errorTitle : copy.title"
      :description="
        state === 'ok'
          ? copy.okText
          : state === 'error'
            ? copy.errorText
            : copy.waitText
      "
    />
    <section class="section pt-10 pb-24">
      <div class="flex flex-wrap gap-3">
        <UiButton v-if="state === 'ok'" size="lg" arrow :to="coursePage">
          {{ copy.start }}
        </UiButton>
        <UiButton
          v-if="state === 'error'"
          size="lg"
          variant="outline"
          :to="localePath('curso-online-entrar')"
        >
          {{ copy.signIn }}
        </UiButton>
        <UiButton
          v-if="state === 'error'"
          size="lg"
          variant="outline"
          :to="localePath('contactos')"
        >
          {{ copy.contact }}
        </UiButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const lang = useAppLocale();
const localePath = useLocalePath();
const route = useRoute();
const { refresh } = useCourseAccount();

const COPY = {
  en: {
    contact: "Contact us",
    errorText:
      "We could not confirm your payment yet. If you were charged, you will get access anyway: sign in with the email you used, or write to us.",
    errorTitle: "Something is missing",
    eyebrow: "Online courses",
    okText:
      "Your payment went through and you are signed in. We also sent a receipt to your email.",
    signIn: "Sign in",
    start: "Go to the course",
    title: "Thank you!",
    waitText: "Confirming your payment…",
  },
  pt: {
    contact: "Falar connosco",
    errorText:
      "Ainda não foi possível confirmar o pagamento. Em caso de cobrança, o acesso fica garantido na mesma: entrar com o email usado na compra, ou escrever ao IPB.",
    errorTitle: "Falta qualquer coisa",
    eyebrow: "Cursos online",
    okText:
      "O pagamento foi concluído e a sessão está iniciada. Foi também enviado um recibo para o email da compra.",
    signIn: "Entrar",
    start: "Ir para o curso",
    title: "Obrigado!",
    waitText: "A confirmar o pagamento…",
  },
} as const;
const copy = computed(() => COPY[lang.value]);

const state = ref<"wait" | "ok" | "error">("wait");
const course = ref("");
const coursePage = computed(() =>
  course.value
    ? localePath({
        name: "curso-online-curso",
        params: { curso: course.value },
      })
    : localePath("curso-online")
);

async function confirm(sessionId: string, tries = 3): Promise<void> {
  try {
    const res = await $fetch<{ course: string }>("/api/curso/confirmar", {
      body: { session_id: sessionId },
      method: "POST",
    });
    course.value = res.course;
    state.value = "ok";
    await refresh();
  } catch {
    if (tries > 1) {
      await promiseTimeout(2000);
      return confirm(sessionId, tries - 1);
    }
    state.value = "error";
  }
}

onMounted(() => {
  const sessionId = String(route.query.session_id ?? "");
  if (route.query.status === "success" && sessionId) {
    confirm(sessionId);
  } else {
    state.value = "error";
  }
});

useSeoMeta({ robots: "noindex, nofollow", title: () => copy.value.title });
</script>
