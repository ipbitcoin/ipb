<template>
  <main>
    <article
      v-if="article"
      class="max-w-screen-xl mx-auto flex flex-col mt-20 px-8 mb-12 gap-4"
    >
      <img
        :src="article.main_image.url"
        :alt="article.title"
        class="max-w-[400px]"
      />
      <h1 class="text-4xl uppercase font-semibold">{{ article?.title }}</h1>
      <div class="flex flex-col gap-1">
        <span>{{
          new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-US", {
            dateStyle: "short",
          }).format(new Date(article.createdAt))
        }}</span>
        <span>
          {{ $t("common.by") }}
          <template v-for="(author, i) in article.authors" :key="author.name">
            <NuxtLink
              :to="
                localePath({
                  name: 'autor-slug',
                  params: { slug: author.slug },
                })
              "
              class="underline underline-offset-2 hover:no-underline"
              >{{ author.name }}</NuxtLink
            ><span v-if="i < (article.authors?.length ?? 0) - 1">, </span>
          </template>
        </span>
        <span
          >{{ $t("article.readingTime") }}: {{ article.read_time }}
          {{ $t("time.minute", article.read_time).toLowerCase() }}</span
        >
      </div>
      <div v-if="article.audio">
        <button
          v-if="!listenToAudio"
          class="cursor-pointer inline-flex items-center gap-1.5 font-medium border rounded-md py-1 px-1.5 hover:bg-gray-100 transition-colors duration-200"
          @click="listenToAudio = true"
        >
          <IconHeadphones class="size-5" />
          {{ $t("article.listenToAudio") }}
        </button>
        <div v-else class="flex flex-col gap-1">
          <audio controls preload="none">
            <source :src="article.audio.url" type="audio/mp4" />
          </audio>
          <span class="text-xs text-gray-500">{{
            $t("article.generated")
          }}</span>
        </div>
      </div>
      <div>
        <MDC
          :value="article.content"
          class="prose prose-headings:prose-a:no-underline prose-headings:my-4 max-w-3xl"
        />
      </div>
    </article>

    <section v-if="relatedArticles?.length" class="border-t mt-4">
      <div class="max-w-screen-xl mx-auto px-8 py-12 flex flex-col gap-8">
        <h2 class="text-3xl font-light">
          {{ locale === "pt" ? "Artigos relacionados" : "Related articles" }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="related in relatedArticles"
            :key="related.documentId"
            :title="related.title"
            :slug="related.slug"
            :category="related.category?.name"
            :image="related.main_image.url"
            :created-at="related.createdAt"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const route = useRoute();
const localePath = useLocalePath();
const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();

const slug = String(route.params.slug);

const { data: article } = useAsyncData(`article-${slug}`, () =>
  convex.query(api.articles.getBySlug, {
    slug,
    locale: appLocale.value,
  })
);

const listenToAudio = ref(false);

// Related articles — same category, excluding current (server-sorted, top 3)
const { data: relatedArticles } = useAsyncData(
  `related-${slug}-${locale.value}`,
  async () => {
    const categoryType = article.value?.category?.type;
    if (!categoryType) {
      return [];
    }
    return await convex.query(api.articles.listPublished, {
      locale: appLocale.value,
      categoryType,
      excludeSlug: slug,
      limit: 3,
    });
  },
  { watch: [article] }
);

// Meta tags e JSON-LD dinâmicos baseados no artigo
watchEffect(() => {
  if (!article.value) {
    return;
  }

  const a = article.value;
  const baseUrl = "https://institutobitcoin.pt";
  const imgUrl = a.main_image?.url ?? `${baseUrl}/og-image.png`;
  const articlePath =
    locale.value === "en" ? `/en/article/${a.slug}` : `/artigo/${a.slug}`;
  const articleUrl = `${baseUrl}${articlePath}`;

  // Extrai descrição limpa do conteúdo (remove markdown)
  const rawDesc =
    a.content
      ?.slice(0, 200)
      ?.replace(/[#*_`[\]]/g, "")
      ?.trim() ?? "";
  const description =
    rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;

  const authorNames = a.authors?.map((au: { name: string }) => au.name) ?? [];
  const categoryName = a.category?.name ?? "";

  useSeoMeta({
    title: a.title,
    description,
    ogTitle: a.title,
    ogDescription: description,
    ogImage: imgUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogUrl: articleUrl,
    ogType: "article",
    twitterTitle: a.title,
    twitterDescription: description,
    twitterImage: imgUrl,
    twitterCard: "summary_large_image",
    articlePublishedTime: a.createdAt,
    articleModifiedTime: a.updatedAt,
    articleAuthor: authorNames,
    articleSection: categoryName,
    articleTag: categoryName,
    twitterLabel1: locale.value === "pt" ? "Autor" : "Author",
    twitterData1: authorNames.join(", ") || "IPB",
    twitterLabel2: locale.value === "pt" ? "Tempo de leitura" : "Reading time",
    twitterData2: `${a.read_time} min`,
  });

  // JSON-LD: Article + BreadcrumbList
  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description,
          image: {
            "@type": "ImageObject",
            url: imgUrl,
            width: 1200,
            height: 630,
          },
          datePublished: a.createdAt,
          dateModified: a.updatedAt,
          url: articleUrl,
          inLanguage: locale.value === "en" ? "en-US" : "pt-PT",
          author: authorNames.map((name: string) => ({
            "@type": "Person",
            name,
          })),
          publisher: {
            "@type": "Organization",
            name: "Instituto Português de Bitcoin",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/ipb_color_dark.svg`,
            },
          },
          ...(categoryName && {
            articleSection: categoryName,
            keywords: categoryName,
          }),
        }),
      },
      {
        type: "application/ld+json",
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
            ...(categoryName
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: categoryName,
                    item: baseUrl,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: categoryName ? 3 : 2,
              name: a.title,
              item: articleUrl,
            },
          ],
        }),
      },
    ],
  });
});
</script>
