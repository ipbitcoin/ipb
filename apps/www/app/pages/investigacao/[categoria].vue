<template>
  <div v-if="page">
    <IPBPageHeader :eyebrow="$t('research.eyebrow')" :title="page.name">
      <template #before>
        <IPBBackLink :to="localePath('investigacao')">
          {{ $t("nav.research") }}
        </IPBBackLink>
      </template>

      <!-- The other themes stay one tap away. -->
      <nav :aria-label="$t('nav.research')" class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="category in page.categories"
          :key="category.documentId"
          :to="categoryPath(category.slug)"
          :class="[
            'chip',
            category.slug === page.slug ? 'chip-on' : 'chip-off',
          ]"
        >
          {{ category.name }}
        </NuxtLink>
      </nav>
    </IPBPageHeader>

    <IPBArticleGrid
      :title="page.name"
      :articles="articles"
      :pending="pending"
      :initial-count="9"
      :show-date="false"
      :empty-label="$t('research.empty')"
      hide-header
      priority
    />
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale, t } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();
const localePath = useLocalePath();
const setI18nParams = useSetI18nParams();

const categoria = String(route.params.categoria);

function categoryPath(slug: string) {
  return localePath({
    name: "investigacao-categoria",
    params: { categoria: slug },
  });
}

// Started before the awaited lookup below, so both requests run together.
const { data: articles, status } = useAsyncData(
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

// Awaited: the title, description and breadcrumbs are built from it and must
// be in the server-rendered HTML. The other language's list gives this
// category's slug there, for the language switcher and the hreflang links.
const { data, error } = await useAsyncData(
  `research-category-${categoria}-${locale.value}`,
  async () => {
    const otherLocale = appLocale.value === "pt" ? "en" : "pt";
    const [categories, translations] = await Promise.all([
      convex.query(api.categories.list, {
        locale: appLocale.value,
        type: "research",
      }),
      convex.query(api.categories.list, {
        locale: otherLocale,
        type: "research",
      }),
    ]);

    const current = categories.find((c) => c.slug === categoria);
    if (!current) {
      // The old language switcher kept the other language's slug in the
      // address. Send those links to the right one.
      const moved = translations.find((c) => c.slug === categoria);
      const target =
        moved && categories.find((c) => c.documentId === moved.documentId);
      return target ? { movedTo: target.slug } : null;
    }

    const translated =
      translations.find((c) => c.documentId === current.documentId)?.slug ??
      current.slug;
    return {
      categories,
      name: current.name,
      slug: current.slug,
      slugs:
        appLocale.value === "pt"
          ? { en: translated, pt: current.slug }
          : { en: current.slug, pt: translated },
    };
  }
);

// Narrowed by value, not with `in`: TypeScript gives each returned shape the
// other's keys as optional `undefined`, so `in` would not tell them apart.
const result = data.value;
const page = result?.categories ? result : null;

if (result?.movedTo) {
  // Permanent, so search engines swap the old address for the new one.
  await navigateTo(categoryPath(result.movedTo), {
    redirectCode: 301,
    replace: true,
  });
} else if (!page) {
  throw createError({
    fatal: true,
    statusCode: error.value ? 500 : 404,
    statusMessage: error.value
      ? "Research category unavailable"
      : "Research category not found",
  });
}

if (page) {
  setI18nParams({
    en: { categoria: page.slugs.en },
    pt: { categoria: page.slugs.pt },
  });

  // The title runs through the global "%s | Instituto Português de Bitcoin"
  // template; social titles do not, so they carry the short name instead.
  const title =
    appLocale.value === "pt"
      ? `Investigação Bitcoin: ${page.name}`
      : `Bitcoin Research: ${page.name}`;
  const description =
    appLocale.value === "pt"
      ? `Estudos e artigos sobre Bitcoin — ${page.name}. Investigação independente pelo Instituto Português de Bitcoin.`
      : `Studies and articles on Bitcoin — ${page.name}. Independent research by the Portuguese Bitcoin Institute.`;

  useSeoMeta({
    description,
    ogDescription: description,
    ogTitle: `${title} | IPB`,
    title,
    twitterDescription: description,
    twitterTitle: `${title} | IPB`,
  });

  // Joins the site-wide schema.org graph, which links it to this web page.
  useSchemaOrg([
    defineBreadcrumb({
      itemListElement: [
        { item: localePath("index"), name: t("seo.title") },
        { item: localePath("investigacao"), name: t("nav.research") },
        { item: categoryPath(page.slug), name: page.name },
      ],
    }),
  ]);
}
</script>
