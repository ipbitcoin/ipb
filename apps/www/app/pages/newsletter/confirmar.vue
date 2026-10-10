<template>
  <main class="section flex flex-col gap-6 pt-20 pb-24 sm:pt-24">
    <h1
      class="max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
    >
      {{ t("newsletter.confirm.title") }}
    </h1>

    <p v-if="state === 'loading'" role="status" class="text-lg text-black/70">
      {{ t("newsletter.confirm.loading") }}
    </p>
    <p
      v-else-if="state === 'success'"
      role="status"
      class="flex max-w-2xl items-start gap-2 text-lg"
    >
      <IconCheck class="mt-1 size-5 shrink-0" aria-hidden="true" />
      {{ t("newsletter.confirm.success") }}
    </p>
    <p v-else role="alert" class="max-w-2xl text-lg text-red-600">
      {{ t("newsletter.confirm.error") }}
    </p>

    <UiButton
      v-if="state !== 'loading'"
      class="w-fit"
      variant="outline"
      :to="localePath('index')"
    >
      {{ t("newsletter.confirm.back") }}
    </UiButton>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();

useSeoMeta({
  robots: "noindex, nofollow",
  title: t("newsletter.confirm.title"),
});

const state = ref<"loading" | "success" | "error">("loading");

onMounted(async () => {
  const token = route.query.token;
  if (typeof token !== "string") {
    state.value = "error";
    return;
  }
  try {
    await $fetch("/api/newsletter-confirm", {
      body: { token },
      method: "POST",
    });
    state.value = "success";
  } catch {
    state.value = "error";
  }
});
</script>
