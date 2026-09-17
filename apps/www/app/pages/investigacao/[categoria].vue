<template>
  <main>
    <div class="section pt-20 sm:pt-28">
      <NuxtLink
        :to="localePath('investigacao')"
        class="focus-ring eyebrow rounded transition-colors duration-150 ease-out hover:text-black"
      >
        &larr; {{ $t("nav.research") }}
      </NuxtLink>
      <h1
        class="mt-4 max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
      >
        {{ category?.name ?? categoria }}
      </h1>
    </div>

    <IPBArticleGrid
      :title="category?.name ?? categoria"
      heading-level="h1"
      :articles="researchArticles"
      :pending="pending"
      :initial-count="9"
      :show-date="false"
    />
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();
const localePath = useLocalePath();

const categoria = String(route.params.categoria);

const { data: category } = useAsyncData(
  `research-category-${categoria}-${locale.value}`,
  () =>
    convex.query(api.categories.getBySlug, {
      locale: appLocale.value,
      slug: categoria,
      type: "research",
    }),
  { lazy: true }
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

// Locale belongs in the key: without it a PT payload satisfies an EN request.
const { data: researchArticles, status } = useAsyncData(
  `articles-research-${categoria}-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categorySlug: categoria,
      categoryType: "research",
      locale: appLocale.value,
    }),
  { lazy: true }
);

const pending = computed(() => status.value === "pending");
</script>
