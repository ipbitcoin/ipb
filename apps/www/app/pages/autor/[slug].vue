<template>
  <main>
    <div v-if="author" class="section flex flex-col pt-20 sm:pt-28">
      <div
        class="flex flex-col items-start gap-8 border-b border-black/10 pb-12 sm:flex-row"
      >
        <img
          :src="author.picture.url"
          :alt="author.name"
          loading="lazy"
          class="h-32 w-32 shrink-0 rounded-full object-cover outline -outline-offset-1 outline-black/10"
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
              class="focus-ring inline-flex items-center gap-1.5 rounded-md border border-black/20 px-2 py-1 text-sm font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-black/5 active:scale-[0.96]"
            >
              <IconLinkedIn class="size-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>

    <IPBArticleGrid
      v-if="author"
      :title="locale === 'pt' ? 'Artigos' : 'Articles'"
      :articles="articles"
      :initial-count="6"
      show-category
    />

    <div v-if="!author" class="section mt-20">
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
// Non-lazy and locale-keyed: page meta is built from this data.
const { data: author } = useAsyncData(`author-${slug}-${locale.value}`, () =>
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
