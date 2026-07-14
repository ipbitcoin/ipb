<template>
  <main>
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
      <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
        {{ $t("nav.research") }}
      </h1>
      <h2 class="text-lg font-semibold uppercase">{{ categoria }}</h2>
      <div class="flex flex-col gap-2 mt-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in researchArticles"
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
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();

const categoria = String(route.params.categoria);

const { data: category } = useAsyncData(
  `research-category-${categoria}-${locale.value}`,
  () =>
    convex.query(api.categories.getBySlug, {
      locale: appLocale.value,
      slug: categoria,
      type: "research",
    })
);

watchEffect(() => {
  if (!category.value) {
    return;
  }
  const { name } = category.value;
  const baseUrl = "https://institutobitcoin.pt";
  const path =
    locale.value === "en"
      ? `/en/research/${categoria}`
      : `/investigacao/${categoria}`;

  useSeoMeta({
    description:
      locale.value === "pt"
        ? `Estudos e artigos sobre Bitcoin — ${name}. Investigação independente pelo Instituto Português de Bitcoin.`
        : `Studies and articles on Bitcoin — ${name}. Independent research by the Portuguese Bitcoin Institute.`,
    ogDescription:
      locale.value === "pt"
        ? `Estudos e artigos sobre Bitcoin — ${name}. Investigação independente pelo Instituto Português de Bitcoin.`
        : `Studies and articles on Bitcoin — ${name}. Independent research by the Portuguese Bitcoin Institute.`,
    ogTitle:
      locale.value === "pt"
        ? `Investigação Bitcoin: ${name} | IPB`
        : `Bitcoin Research: ${name} | IPB`,
    ogType: "website",
    ogUrl: `${baseUrl}${path}`,
    title:
      locale.value === "pt"
        ? `Investigação Bitcoin: ${name} | IPB`
        : `Bitcoin Research: ${name} | IPB`,
    twitterDescription:
      locale.value === "pt"
        ? `Estudos e artigos sobre Bitcoin — ${name}. Instituto Português de Bitcoin.`
        : `Studies and articles on Bitcoin — ${name}. Portuguese Bitcoin Institute.`,
    twitterTitle:
      locale.value === "pt"
        ? `Investigação Bitcoin: ${name} | IPB`
        : `Bitcoin Research: ${name} | IPB`,
  });

  useHead({
    script: [
      {
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Instituto Português de Bitcoin",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: locale.value === "pt" ? "Investigação" : "Research",
              item: `${baseUrl}${locale.value === "en" ? "/en/research" : "/investigacao"}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name,
              item: `${baseUrl}${path}`,
            },
          ],
        }),
        type: "application/ld+json",
      },
    ],
  });
});

const { data: researchArticles } = useAsyncData(
  `articles-research-${categoria}`,
  () =>
    convex.query(api.articles.listPublished, {
      categorySlug: categoria,
      categoryType: "research",
      locale: appLocale.value,
    })
);
</script>
