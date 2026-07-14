<template>
  <main>
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
      <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
        {{ $t("nav.research") }}
      </h1>
      <p class="text-lg max-w-4xl text-balance">
        {{ $t("research.description") }}
      </p>
      <div
        v-for="category in researchCategories"
        class="flex flex-col gap-2 mt-4"
      >
        <h2 class="uppercase text-xl font-semibold">{{ category.name }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in researchArticles?.filter(
              (a) => a.category?.slug === category.slug
            )"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :image="article.main_image.url"
          />
        </div>
      </div>
    </div>
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

const { data: researchCategories } = useAsyncData(
  `research-categories-${locale.value}`,
  () =>
    convex.query(api.categories.list, {
      locale: appLocale.value,
      type: "research",
    })
);

const { data: researchArticles } = useAsyncData(
  `articles-research-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "research",
      locale: appLocale.value,
    })
);
</script>
