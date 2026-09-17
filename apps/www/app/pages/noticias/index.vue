<template>
  <main>
    <IPBArticleGrid
      :eyebrow="$t('news.eyebrow')"
      :title="$t('news.title')"
      :description="$t('news.description')"
      :articles="newsArticles"
      :pending="pending"
      :initial-count="9"
      :empty-label="$t('news.empty')"
    />
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

const { data: newsArticles, status } = useAsyncData(
  `articles-news-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "news",
      locale: appLocale.value,
    }),
  { lazy: true }
);

const pending = computed(() => status.value === "pending");
</script>
