<template>
  <main>
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-16 px-8">
      <div class="flex flex-col gap-4">
        <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
          {{ $t("nav.education") }}
        </h1>
        <p class="text-lg max-w-4xl text-balance">
          {{ $t("education.description") }}
        </p>
      </div>

      <section v-if="books && books.length > 0" class="flex flex-col gap-8">
        <h2 class="text-3xl font-light border-b border-black/10 pb-4">
          {{ $t("education.books.title") }}
        </h2>

        <div class="flex flex-col lg:flex-row gap-10 items-start">
          <div class="flex-1 flex flex-col gap-8">
            <div class="grid grid-cols-3 gap-x-4 gap-y-8">
              <IPBBookCard
                v-for="book in visibleBooks"
                :key="book.documentId"
                :title="book.title"
                :author="book.author"
                :cover-url="book.cover?.url"
                :publisher="book.publisher?.name"
                :year="book.year"
                :pages="book.pages"
                :description="book.description"
                :url="book.url"
              />
            </div>

            <div class="flex justify-center gap-4">
              <button
                v-if="hasMoreBooks"
                @click="showMore"
                class="cursor-pointer border border-black px-6 py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-black hover:text-white transition-colors duration-200"
              >
                {{ $t("education.books.showMore") }}
              </button>
              <button
                v-if="canShowLess"
                @click="showLess"
                class="cursor-pointer border border-black/30 px-6 py-2.5 text-sm font-medium uppercase tracking-wide hover:border-black transition-colors duration-200"
              >
                {{ $t("education.books.showLess") }}
              </button>
            </div>
          </div>

          <aside
            v-if="publishers.length > 0"
            class="lg:w-52 shrink-0 flex flex-col gap-3 lg:sticky lg:top-8"
          >
            <p
              class="text-xs uppercase tracking-widest font-medium text-black/50"
            >
              {{ $t("education.books.filterByPublisher") }}
            </p>
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="selectedPublisher"
                  value=""
                  class="accent-black"
                />
                <span class="text-sm">{{
                  $t("education.books.allPublishers")
                }}</span>
              </label>
              <label
                v-for="publisher in publishers"
                :key="publisher"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  v-model="selectedPublisher"
                  :value="publisher"
                  class="accent-black"
                />
                <span class="text-sm">{{ publisher }}</span>
              </label>
            </div>
          </aside>
        </div>
      </section>

      <section class="flex flex-col gap-8">
        <h2 class="text-3xl font-light border-b border-black/10 pb-4">
          {{ $t("education.articles.title") }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in educationArticles"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :image="article.main_image.url"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();

const PAGE_SIZE = 6;

const baseUrl = "https://institutobitcoin.pt";
const isPt = locale.value === "pt";
const pageUrl = isPt ? `${baseUrl}/educacao` : `${baseUrl}/en/education`;
const ogImage = `${baseUrl}/og-image.png`;

useSeoMeta({
  description: isPt
    ? "Material educativo sobre Bitcoin: como funciona, como comprar, segurança e custódia. Pelo Instituto Português de Bitcoin."
    : "Educational material about Bitcoin: how it works, how to buy, security and custody. By the Portuguese Bitcoin Institute.",
  ogDescription: isPt
    ? "Material educativo sobre Bitcoin: como funciona, como comprar, segurança e custódia. Pelo Instituto Português de Bitcoin."
    : "Educational material about Bitcoin: how it works, how to buy, security and custody. By the Portuguese Bitcoin Institute.",
  ogImage,
  ogTitle: isPt ? "Educação Bitcoin | IPB" : "Bitcoin Education | IPB",
  ogType: "website",
  ogUrl: pageUrl,
  title: isPt ? "Educação Bitcoin Portugal" : "Bitcoin Education Portugal",
  twitterCard: "summary_large_image",
  twitterDescription: isPt
    ? "Material educativo sobre Bitcoin: como funciona, como comprar, segurança e custódia. Pelo Instituto Português de Bitcoin."
    : "Educational material about Bitcoin: how it works, how to buy, security and custody. By the Portuguese Bitcoin Institute.",
  twitterImage: ogImage,
  twitterTitle: isPt ? "Educação Bitcoin | IPB" : "Bitcoin Education | IPB",
});

// BreadcrumbList — always present
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
            name: isPt ? "Educação" : "Education",
            item: pageUrl,
          },
        ],
      }),
      type: "application/ld+json",
    },
  ],
});

const { data: books } = useAsyncData(`books-${locale.value}`, async () => {
  try {
    return await convex.query(api.books.listActive, {
      locale: appLocale.value,
    });
  } catch {
    return [];
  }
});

const selectedPublisher = ref("");
const visibleCount = ref(PAGE_SIZE);

watch(selectedPublisher, () => {
  visibleCount.value = PAGE_SIZE;
});

const filteredBooks = computed(() => {
  const all = [...(books.value ?? [])].toSorted((a, b) =>
    a.title.localeCompare(b.title, "pt", { sensitivity: "base" })
  );
  if (!selectedPublisher.value) {
    return all;
  }
  return all.filter((b) => b.publisher?.name === selectedPublisher.value);
});

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

const publishers = computed(() => {
  const names = (books.value ?? [])
    .map((b) => b.publisher?.name)
    .filter((name): name is string => typeof name === "string");
  return [...new Set(names)].toSorted((a, b) => a.localeCompare(b, "pt"));
});

// Book ItemList schema — emitted once books are loaded from Strapi
watchEffect(() => {
  if (!books.value?.length) {
    return;
  }

  useHead({
    script: [
      {
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: isPt
            ? "Livros sobre Bitcoin recomendados pelo IPB"
            : "Bitcoin books recommended by IPB",
          url: pageUrl,
          numberOfItems: books.value.length,
          itemListElement: books.value.map((book, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Book",
              name: book.title,
              author: { "@type": "Person", name: book.author },
              ...(book.publisher?.name
                ? {
                    publisher: {
                      "@type": "Organization",
                      name: book.publisher.name,
                    },
                  }
                : {}),
              ...(book.year ? { datePublished: String(book.year) } : {}),
              ...(book.pages ? { numberOfPages: book.pages } : {}),
              ...(book.description ? { description: book.description } : {}),
              ...(book.url ? { url: book.url } : {}),
              ...(book.cover?.url ? { image: book.cover.url } : {}),
              inLanguage: isPt ? "pt-PT" : "en-US",
            },
          })),
        }),
        key: "books-schema",
        type: "application/ld+json",
      },
    ],
  });
});

const { data: educationArticles } = useAsyncData(
  `articles-education-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      categoryType: "education",
      locale: appLocale.value,
    })
);
</script>
