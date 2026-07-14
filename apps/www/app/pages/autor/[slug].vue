<template>
  <main>
    <div
      v-if="author"
      class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-12 px-8"
    >
      <div class="flex flex-col sm:flex-row gap-8 items-start border-b pb-12">
        <img
          :src="author.picture.url"
          :alt="author.name"
          class="w-32 h-32 object-cover rounded-full shrink-0"
        />
        <div class="flex flex-col gap-3">
          <h1 class="text-5xl font-light">{{ author.name }}</h1>
          <p
            v-if="author.description"
            class="text-lg text-neutral-600 max-w-2xl"
          >
            {{ author.description }}
          </p>
          <div class="flex gap-3 mt-1">
            <a
              v-if="author.linkedin"
              :href="author.linkedin"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm font-medium border rounded-md py-1 px-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <IconLinkedIn class="size-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div v-if="articles?.length" class="flex flex-col gap-8">
        <h2 class="text-4xl font-light">
          {{ locale === "pt" ? "Artigos" : "Articles" }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in articles"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :category="article.category?.name"
            :image="article.main_image.url"
            :created-at="article.createdAt"
          />
        </div>
      </div>
    </div>

    <div v-else class="max-w-screen-xl mx-auto mt-20 px-8">
      <p class="text-lg text-neutral-500">
        {{ locale === "pt" ? "Autor não encontrado." : "Author not found." }}
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const route = useRoute();
const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();

const slug = String(route.params.slug);

// Author slug is materialized in Convex — direct indexed lookup
const { data: author } = useAsyncData(`author-${slug}`, () =>
  convex.query(api.authors.getBySlug, {
    slug,
    locale: appLocale.value,
  })
);

const { data: articles } = useAsyncData(
  `author-articles-${slug}-${locale.value}`,
  async () => {
    if (!author.value) {
      return [];
    }
    return await convex.query(api.articles.listPublished, {
      locale: appLocale.value,
      authorId: author.value.documentId,
    });
  },
  { watch: [author] }
);

watchEffect(() => {
  if (!author.value) {
    return;
  }

  const baseUrl = "https://institutobitcoin.pt";
  const path = locale.value === "en" ? `/en/author/${slug}` : `/autor/${slug}`;
  const imgUrl = author.value.picture?.url ?? `${baseUrl}/og-image.png`;

  useSeoMeta({
    title: author.value.name,
    description:
      author.value.description ??
      (locale.value === "pt"
        ? `Artigos e investigação de ${author.value.name} no Instituto Português de Bitcoin.`
        : `Articles and research by ${author.value.name} at the Portuguese Bitcoin Institute.`),
    ogTitle: `${author.value.name} | IPB`,
    ogDescription: author.value.description ?? "",
    ogImage: imgUrl,
    ogUrl: `${baseUrl}${path}`,
    ogType: "profile",
    twitterTitle: `${author.value.name} | IPB`,
    twitterDescription: author.value.description ?? "",
    twitterImage: imgUrl,
    twitterCard: "summary_large_image",
  });

  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.value.name,
          description: author.value.description,
          image: imgUrl,
          url: `${baseUrl}${path}`,
          worksFor: {
            "@type": "Organization",
            name: "Instituto Português de Bitcoin",
            url: baseUrl,
          },
          ...(author.value.linkedin ? { sameAs: [author.value.linkedin] } : {}),
        }),
      },
    ],
  });
});
</script>
