<template>
  <main>
    <article v-if="article" class="section flex flex-col gap-5 pt-20 pb-12">
      <img
        :src="article.main_image.url"
        :alt="article.title"
        :style="{ viewTransitionName: `article-image-${slug}` }"
        class="max-w-[400px] outline -outline-offset-1 outline-black/10"
      />
      <h1 class="max-w-3xl text-4xl font-semibold text-balance uppercase">
        {{ article?.title }}
      </h1>
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
              class="focus-ring rounded underline underline-offset-2 transition-[text-decoration-color] duration-150 ease-out hover:decoration-transparent"
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
          class="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-black/20 px-1.5 py-1 font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-black/5 active:scale-[0.96]"
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

    <section
      v-if="relatedArticles?.length"
      class="mt-10 border-t border-black/10"
    >
      <IPBArticleGrid
        :title="locale === 'pt' ? 'Artigos relacionados' : 'Related articles'"
        :articles="relatedArticles"
        :initial-count="3"
        show-category
      />
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

// Non-lazy and locale-keyed: page meta and JSON-LD are built from this data.
const { data: article } = useAsyncData(`article-${slug}-${locale.value}`, () =>
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
