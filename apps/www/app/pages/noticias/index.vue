<template>
  <main>
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
      <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
        {{ $t("nav.news") }}
      </h1>
      <p class="text-lg max-w-4xl text-balance">{{ $t("news.description") }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <IPBArticleCard
          v-for="article in newsArticles"
          :key="article.documentId"
          :title="article.title"
          :slug="article.slug"
          :image="article.main_image.url"
          :created-at="article.createdAt"
        />
      </div>
      <span v-if="!newsArticles?.length" class="text-neutral-500">
        {{ $t("news.empty") }}
      </span>
    </div>
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();

useSeoMeta({
  description:
    locale.value === "pt"
      ? "As últimas notícias e análises sobre Bitcoin em Portugal e no mundo, pelo Instituto Português de Bitcoin."
      : "The latest news and analysis on Bitcoin in Portugal and around the world, by the Portuguese Bitcoin Institute.",
  ogDescription:
    locale.value === "pt"
      ? "As últimas notícias e análises sobre Bitcoin em Portugal e no mundo, pelo Instituto Português de Bitcoin."
      : "The latest news and analysis on Bitcoin in Portugal and around the world, by the Portuguese Bitcoin Institute.",
  ogTitle:
    locale.value === "pt"
      ? "Notícias Bitcoin Portugal | IPB"
      : "Bitcoin News Portugal | IPB",
  title:
    locale.value === "pt"
      ? "Notícias Bitcoin Portugal"
      : "Bitcoin News Portugal",
  twitterDescription:
    locale.value === "pt"
      ? "As últimas notícias e análises sobre Bitcoin em Portugal e no mundo, pelo Instituto Português de Bitcoin."
      : "The latest news and analysis on Bitcoin in Portugal and around the world, by the Portuguese Bitcoin Institute.",
  twitterTitle:
    locale.value === "pt"
      ? "Notícias Bitcoin Portugal | IPB"
      : "Bitcoin News Portugal | IPB",
});
const appLocale = useAppLocale();
const convex = useConvex();

const { data: newsArticles } = useAsyncData(
  `articles-news-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "news",
      locale: appLocale.value,
    })
);
</script>
