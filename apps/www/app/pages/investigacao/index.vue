<template>
  <main>
    <div class="section pt-20 sm:pt-28">
      <p class="eyebrow">{{ $t("research.eyebrow") }}</p>
      <h1
        class="mt-4 max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
      >
        {{ $t("nav.research") }}
      </h1>
      <p class="mt-6 max-w-3xl text-lg text-balance text-black/60">
        {{ $t("research.description") }}
      </p>
    </div>

    <IPBSkeleton
      v-if="pending"
      variant="card"
      :count="6"
      class="section mt-16"
    />

    <template v-else>
      <IPBArticleGrid
        v-for="category in researchCategories ?? []"
        :key="category.slug"
        :title="category.name"
        :articles="articlesInCategory(category.slug)"
        :initial-count="6"
        :show-date="false"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();

useSeoMeta({
  description:
    locale.value === "pt"
      ? "Estudos e papers originais sobre Bitcoin em Portugal: economia, energia, mineração e segurança nacional."
      : "Original studies and papers on Bitcoin in Portugal: economics, energy, mining and national security.",
  ogDescription:
    locale.value === "pt"
      ? "Estudos e papers originais sobre Bitcoin em Portugal: economia, energia, mineração e segurança nacional."
      : "Original studies and papers on Bitcoin in Portugal: economics, energy, mining and national security.",
  ogTitle:
    locale.value === "pt"
      ? "Investigação Bitcoin | IPB"
      : "Bitcoin Research | IPB",
  title:
    locale.value === "pt"
      ? "Investigação Bitcoin Portugal"
      : "Bitcoin Research Portugal",
  twitterDescription:
    locale.value === "pt"
      ? "Estudos e papers originais sobre Bitcoin em Portugal: economia, energia, mineração e segurança nacional."
      : "Original studies and papers on Bitcoin in Portugal: economics, energy, mining and national security.",
  twitterTitle:
    locale.value === "pt"
      ? "Investigação Bitcoin | IPB"
      : "Bitcoin Research | IPB",
});
const appLocale = useAppLocale();
const convex = useConvex();

const { data: researchCategories, status: statusCategories } = useAsyncData(
  `research-categories-${locale.value}`,
  () =>
    convex.query(api.categories.list, {
      locale: appLocale.value,
      type: "research",
    }),
  { lazy: true }
);

const { data: researchArticles, status: statusArticles } = useAsyncData(
  `articles-research-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "research",
      locale: appLocale.value,
    }),
  { lazy: true }
);

const pending = computed(
  () =>
    statusCategories.value === "pending" || statusArticles.value === "pending"
);

function articlesInCategory(slug: string) {
  return (researchArticles.value ?? []).filter(
    (a) => a.category?.slug === slug
  );
}
</script>
