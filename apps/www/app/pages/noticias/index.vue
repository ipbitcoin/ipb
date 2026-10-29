<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('news.eyebrow')"
      :title="$t('news.title')"
      :description="$t('news.description')"
    />

    <IPBArticleGrid
      :title="$t('news.title')"
      :articles="newsArticles"
      :pending="pending"
      :initial-count="9"
      :empty-label="$t('news.empty')"
      hide-header
      featured
      priority
    />
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();

const SEO = {
  en: {
    description:
      "The latest news and analysis on Bitcoin in Portugal and around the world, by the Portuguese Bitcoin Institute.",
    title: "Bitcoin News Portugal",
  },
  pt: {
    description:
      "As últimas notícias e análises sobre Bitcoin em Portugal e no mundo, pelo Instituto Português de Bitcoin.",
    title: "Notícias Bitcoin Portugal",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.title} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.title} | IPB`,
});

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
