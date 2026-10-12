<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('research.eyebrow')"
      :title="$t('nav.research')"
      :description="$t('research.description')"
    >
      <!-- Jump straight to a theme; each one also has its own page. -->
      <nav
        v-if="researchCategories?.length"
        :aria-label="$t('nav.research')"
        class="flex flex-wrap gap-2"
      >
        <NuxtLink
          v-for="category in researchCategories"
          :key="category.slug"
          :to="categoryPath(category.slug)"
          class="chip chip-off"
        >
          {{ category.name }}
        </NuxtLink>
      </nav>
    </IPBPageHeader>

    <IPBSkeleton
      v-if="pending"
      variant="card"
      :count="3"
      class="section pt-12 pb-20 sm:pt-16 sm:pb-28"
    />

    <template v-else>
      <IPBArticleGrid
        v-for="(category, index) in researchCategories ?? []"
        :key="category.slug"
        :section-id="category.slug"
        :title="category.name"
        :articles="articlesInCategory(category.slug)"
        :initial-count="3"
        :to="categoryPath(category.slug)"
        :show-date="false"
        :priority="index === 0"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const localePath = useLocalePath();
const appLocale = useAppLocale();
const convex = useConvex();

const SEO = {
  en: {
    description:
      "Original studies and papers on Bitcoin in Portugal: economics, energy, mining and national security.",
    social: "Bitcoin Research",
    title: "Bitcoin Research Portugal",
  },
  pt: {
    description:
      "Estudos e papers originais sobre Bitcoin em Portugal: economia, energia, mineração e segurança nacional.",
    social: "Investigação Bitcoin",
    title: "Investigação Bitcoin Portugal",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.social} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.social} | IPB`,
});

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
  { lazy: true, transform: toArticleSummaries }
);

const pending = computed(
  () =>
    statusCategories.value === "pending" || statusArticles.value === "pending"
);

function categoryPath(slug: string) {
  return localePath({
    name: "investigacao-categoria",
    params: { categoria: slug },
  });
}

function articlesInCategory(slug: string) {
  return (researchArticles.value ?? []).filter(
    (a) => a.category?.slug === slug
  );
}
</script>
