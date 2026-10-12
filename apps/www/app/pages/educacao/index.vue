<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('education.eyebrow')"
      :title="$t('education.title')"
      :description="$t('education.description')"
    />

    <section
      v-if="books.length"
      aria-labelledby="books-heading"
      class="section section-gap"
    >
      <div class="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div class="flex max-w-3xl flex-col gap-4">
          <h2 id="books-heading" class="section-title">
            {{ $t("education.books.title") }}
          </h2>
          <p class="lead mt-1 max-w-2xl">
            {{ $t("education.books.description") }}
          </p>
        </div>

        <!-- Only worth offering once there is more than one to pick from. -->
        <div
          v-if="publishers.length > 1"
          role="group"
          :aria-label="$t('education.books.filterByPublisher')"
          class="flex flex-wrap gap-2"
        >
          <button
            v-for="option in publisherOptions"
            :key="option.value"
            type="button"
            :aria-pressed="selectedPublisher === option.value"
            :class="[
              'chip',
              selectedPublisher === option.value ? 'chip-on' : 'chip-off',
            ]"
            @click="selectedPublisher = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <ul
        class="mt-12 grid grid-cols-2 gap-x-4 gap-y-14 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
      >
        <li
          v-for="(book, index) in visibleBooks"
          :key="book.documentId"
          class="reveal"
          :style="{ '--reveal-delay': `${(index % 4) * 100}ms` }"
        >
          <IPBBookCard
            :title="book.title"
            :author="book.author"
            :cover-url="book.cover?.url"
            :publisher="book.publisher?.name"
            :year="book.year"
            :pages="book.pages"
            :description="book.description"
            :url="book.url"
            :eager="index < 4"
          />
        </li>
      </ul>

      <div
        v-if="hasMoreBooks || canShowLess"
        class="mt-14 flex flex-wrap justify-center gap-3"
      >
        <UiButton v-if="hasMoreBooks" variant="outline" @click="showMore">
          {{ $t("education.books.showMore") }}
        </UiButton>
        <UiButton v-if="canShowLess" variant="subtle" @click="showLess">
          {{ $t("education.books.showLess") }}
        </UiButton>
      </div>
    </section>

    <IPBArticleGrid
      :title="$t('education.articles.title')"
      :description="$t('education.articles.description')"
      :articles="articles"
      :pending="pendingArticles"
      :show-date="false"
      featured
    />
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale, t } = useI18n();
const localePath = useLocalePath();
const appLocale = useAppLocale();
const convex = useConvex();

const PAGE_SIZE = 8;

const SEO = {
  en: {
    books: "Bitcoin books recommended by IPB",
    description:
      "Educational material about Bitcoin: how it works, how to buy, security and custody. By the Portuguese Bitcoin Institute.",
    social: "Bitcoin Education",
    title: "Bitcoin Education Portugal",
  },
  pt: {
    books: "Livros sobre Bitcoin recomendados pelo IPB",
    description:
      "Material educativo sobre Bitcoin: como funciona, como comprar, segurança e custódia. Pelo Instituto Português de Bitcoin.",
    social: "Educação Bitcoin",
    title: "Educação Bitcoin Portugal",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.social} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.social} | IPB`,
});

// Started before the books are awaited, so both lists load at the same time.
// The server waits for it as well; `lazy` only lets client-side navigation
// show the page while it loads.
const { data: articles, status: articlesStatus } = useAsyncData(
  `articles-education-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "education",
      locale: appLocale.value,
    }),
  { lazy: true, transform: toArticleSummaries }
);

const pendingArticles = computed(() => articlesStatus.value === "pending");

// Awaited, so the reading list is in the server-rendered page along with its
// structured data. If it fails to load, the page still has its articles.
const { data: books } = await useAsyncData(
  `books-${locale.value}`,
  () =>
    convex
      .query(api.books.listActive, { locale: appLocale.value })
      .then((list) =>
        list.toSorted((a, b) =>
          a.title.localeCompare(b.title, "pt", { sensitivity: "base" })
        )
      )
      .catch(() => []),
  { default: () => [] }
);

const publishers = computed(() => {
  const names = books.value
    .map((book) => book.publisher?.name)
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)].toSorted((a, b) => a.localeCompare(b, "pt"));
});

const publisherOptions = computed(() => [
  { label: t("education.books.allPublishers"), value: "" },
  ...publishers.value.map((name) => ({ label: name, value: name })),
]);

const selectedPublisher = ref("");
const visibleCount = ref(PAGE_SIZE);

watch(selectedPublisher, () => {
  visibleCount.value = PAGE_SIZE;
});

const filteredBooks = computed(() =>
  selectedPublisher.value
    ? books.value.filter(
        (book) => book.publisher?.name === selectedPublisher.value
      )
    : books.value
);

const visibleBooks = computed(() =>
  filteredBooks.value.slice(0, visibleCount.value)
);
const hasMoreBooks = computed(
  () => visibleCount.value < filteredBooks.value.length
);
const canShowLess = computed(() => visibleCount.value > PAGE_SIZE);

function showMore() {
  visibleCount.value += PAGE_SIZE;
}

function showLess() {
  visibleCount.value = PAGE_SIZE;
}

// Joins the site-wide schema.org graph, which links it to this web page.
// Each book stays nested in the list: as top-level nodes, books and people
// without an id of their own would merge into the institute's node. No
// `inLanguage`: the list does not record which language an edition is in.
useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { item: localePath("index"), name: t("seo.title") },
      { item: localePath("educacao"), name: t("education.title") },
    ],
  }),
  ...(books.value.length
    ? [
        defineItemList({
          itemListElement: books.value.map((book) => ({
            item: {
              "@type": "Book",
              author: splitAuthors(book.author).map((name) => ({
                "@type": "Person",
                name,
              })),
              datePublished: book.year ? String(book.year) : undefined,
              description: book.description?.replaceAll(/\s+/g, " ").trim(),
              image: book.cover?.url,
              name: book.title,
              numberOfPages: book.pages,
              publisher: book.publisher?.name
                ? { "@type": "Organization", name: book.publisher.name }
                : undefined,
              url: book.url,
            },
          })),
          name: seo.value.books,
        }),
      ]
    : []),
]);
</script>
