<template>
  <div>
    <IPBHero :latest="latestArticle" />

    <IPBArticleGrid
      v-if="pendingArticles || newsArticles.length"
      section-id="news"
      :eyebrow="$t('news.eyebrow')"
      :title="$t('news.title')"
      :articles="newsArticles"
      :pending="pendingArticles"
      :initial-count="6"
      :to="localePath('noticias')"
      :empty-label="$t('news.empty')"
      featured
    />

    <IPBValues :values="values" :pending="pendingValues" />

    <IPBArticleGrid
      section-id="research"
      :eyebrow="$t('research.eyebrow')"
      :title="$t('research.title')"
      :description="$t('research.description')"
      :articles="researchArticles"
      :pending="pendingArticles"
      :initial-count="6"
      :to="localePath('investigacao')"
      show-category
      :show-date="false"
    />

    <IPBArticleGrid
      section-id="education"
      :eyebrow="$t('education.eyebrow')"
      :title="$t('education.title')"
      :description="$t('education.description')"
      :articles="educationArticles"
      :pending="pendingArticles"
      :initial-count="6"
      :to="localePath('educacao')"
      :show-date="false"
    />

    <IPBPartners
      v-if="pendingPartners || partners?.length"
      :partners="partners"
      :pending="pendingPartners"
    />

    <IPBFaq :faqs="faqs" :pending="pendingFaqs" />

    <IPBDocumentList :documents="documents" :pending="pendingDocuments" />

    <!-- Closing call to action. The newsletter already sits in the footer
         right below, so this band asks for the bigger commitment. -->
    <section
      id="join"
      aria-labelledby="join-title"
      class="section pb-20 sm:pb-28"
    >
      <div
        class="reveal relative isolate overflow-hidden rounded-3xl bg-brand px-6 py-14 text-neutral-950 sm:px-12 sm:py-16 lg:px-16 lg:py-20"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0_0_0/0.07)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0_0_0/0.07)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_70%_100%_at_100%_100%,black,transparent_70%)]"
        />
        <div
          class="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16"
        >
          <div class="flex max-w-2xl flex-col gap-4">
            <p class="eyebrow text-neutral-950/70 before:bg-neutral-950">
              {{ $t("main.support.eyebrow") }}
            </p>
            <h2 id="join-title" class="section-title">
              {{ $t("nav.join") }}
            </h2>
            <p
              class="mt-1 text-lg leading-relaxed text-pretty text-neutral-950/75"
            >
              {{ $t("join.mission") }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-3">
            <UiButton size="lg" arrow :to="localePath('juntar')">
              {{ $t("join.member") }}
            </UiButton>
            <UiButton
              size="lg"
              variant="inverse"
              :to="`${localePath('juntar')}#donate`"
            >
              {{ $t("join.donate") }}
            </UiButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const localePath = useLocalePath();
const { locale, t } = useI18n();
const convex = useConvex();
const currentLocale = useAppLocale();

// Getters keep the tags in step with the language switcher. The title runs
// through the global "%s | Instituto Português de Bitcoin" template, so it
// must not repeat the name. og:url comes from the i18n/site config.
useSeoMeta({
  description: () => `${t("main.header")}. ${t("main.subheader")}`,
  ogDescription: () => t("main.subheader"),
  ogTitle: () => `${t("seo.title")}: ${t("main.header")}`,
  title: () => t("main.header"),
  twitterDescription: () => t("main.subheader"),
  twitterTitle: () => `${t("seo.title")}: ${t("main.header")}`,
});

// All lists come server-sorted (order asc / createdAt desc) from Convex.
// `lazy` keeps route changes instant; each section shows a skeleton instead.
const { data: values, status: statusValues } = useAsyncData(
  `values-${locale.value}`,
  () => convex.query(api.values.list, { locale: currentLocale.value }),
  { lazy: true }
);

const { data: partners, status: statusPartners } = useAsyncData(
  "partners",
  () => convex.query(api.partners.list, {}),
  { lazy: true }
);

// Cards only need a summary: dropping the article bodies keeps the SSR
// payload small, since it is inlined into every home page response.
const { data: articles, status: statusArticles } = useAsyncData(
  `articles-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, { locale: currentLocale.value }),
  { lazy: true, transform: toArticleSummaries }
);

const { data: faqs, status: statusFaqs } = useAsyncData(
  `faq-${locale.value}`,
  () => convex.query(api.faqs.list, { locale: currentLocale.value }),
  { lazy: true }
);

const { data: documents, status: statusDocuments } = useAsyncData(
  `documents-${locale.value}`,
  () => convex.query(api.docs.list, { locale: currentLocale.value }),
  { lazy: true }
);

const pendingValues = computed(() => statusValues.value === "pending");
const pendingPartners = computed(() => statusPartners.value === "pending");
const pendingArticles = computed(() => statusArticles.value === "pending");
const pendingFaqs = computed(() => statusFaqs.value === "pending");
const pendingDocuments = computed(() => statusDocuments.value === "pending");

const newsArticles = computed(() =>
  (articles.value ?? []).filter((a) => a.category?.type === "news")
);
const researchArticles = computed(() =>
  (articles.value ?? []).filter((a) => a.category?.type === "research")
);
const educationArticles = computed(() =>
  (articles.value ?? []).filter((a) => a.category?.type === "education")
);

// Newest article of any kind, announced above the headline.
const latestArticle = computed(() => {
  const newest = articles.value?.[0];
  return newest ? { slug: newest.slug, title: newest.title } : null;
});

// FAQ structured data. A getter, so it follows the data and the locale
// instead of registering a new head entry on every change.
useHead(() => ({
  script: faqs.value?.length
    ? [
        {
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.value.map((faq) => ({
              "@type": "Question",
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
              name: faq.question,
            })),
          }),
          key: "faq-schema",
          type: "application/ld+json",
        },
      ]
    : [],
}));
</script>
