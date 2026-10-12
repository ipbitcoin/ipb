<template>
  <!-- Shown in place of the page when it fails to render, such as an unknown
       article or author, inside the usual header and footer. -->
  <NuxtLayout>
    <div class="pb-28 sm:pb-40">
      <IPBPageHeader
        :eyebrow="$t('error.code', { code: status })"
        :title="copy.title"
        :description="copy.description"
      >
        <!-- Any navigation clears the error, so a plain link is enough. -->
        <UiButton :to="localePath('index')" arrow>
          {{ $t("error.home") }}
        </UiButton>
      </IPBPageHeader>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const { t } = useI18n();
const localePath = useLocalePath();

// An error revived from the server payload only keeps `statusCode`.
const status = computed(
  () => props.error.statusCode ?? props.error.status ?? 500
);

const copy = computed(() => {
  const kind = status.value === 404 ? "notFound" : "generic";
  return {
    description: t(`error.${kind}.description`),
    title: t(`error.${kind}.title`),
  };
});

useHead({ title: () => copy.value.title });
</script>
