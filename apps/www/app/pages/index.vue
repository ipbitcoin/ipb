<template>
  <div>
    <IPBHero />

    <IPBArticleGrid
      v-if="pendingArticles || newsArticles.length"
      section-id="news"
      :eyebrow="$t('news.eyebrow')"
      :title="$t('news.title')"
      :articles="newsArticles"
      :pending="pendingArticles"
      :initial-count="3"
      :to="localePath('noticias')"
      :empty-label="$t('news.empty')"
    />

    <IPBValues :values="values" :pending="pendingValues" />

    <IPBArticleGrid
      section-id="research"
      :eyebrow="$t('research.eyebrow')"
      :title="$t('research.title')"
      :description="$t('research.description')"
      :articles="researchArticles"
      :pending="pendingArticles"
      :initial-count="3"
      :to="localePath('investigacao')"
      show-category
      :show-date="false"
    />

    <IPBArticleGrid
      section-id="education"
      :eyebrow="$t('education.eyebrow')"
      :title="$t('education.title')"
      :articles="educationArticles"
      :pending="pendingArticles"
      :initial-count="3"
      :to="localePath('educacao')"
      :show-date="false"
    />

    <IPBPartnerMarquee :partners="partners" :pending="pendingPartners" />

    <IPBFaq :faqs="faqs" :pending="pendingFaqs" />

    <IPBDocumentList :documents="documents" :pending="pendingDocuments" />

    <!-- Newsletter closes the page, right before the footer CTA -->
    <section id="newsletter" class="border-t border-black/10">
      <div class="section section-gap flex flex-col gap-5">
        <p class="eyebrow">{{ $t("newsletter.eyebrow") }}</p>
        <h2 class="section-title">{{ $t("newsletter.title") }}</h2>
        <p class="max-w-2xl text-lg text-balance text-black/60">
          {{ $t("newsletter.description") }}
        </p>
        <IPBNewsletterForm class="mt-2" />
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

useSeoMeta({
  description: t("seo.description"),
  ogDescription: t("seo.description"),
  ogTitle: t("seo.title"),
  ogUrl: "https://institutobitcoin.pt",
  title: t("seo.title"),
  twitterDescription: t("seo.description"),
  twitterTitle: t("seo.title"),
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

const { data: articles, status: statusArticles } = useAsyncData(
  `articles-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, { locale: currentLocale.value }),
  { lazy: true }
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

// FAQ structured data, emitted once the questions are in.
watchEffect(() => {
  if (!faqs.value?.length) {
    return;
  }
  useHead({
    script: [
      {
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.value.map(
            (faq: { question: string; answer: string }) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })
          ),
        }),
        key: "faq-schema",
        type: "application/ld+json",
      },
    ],
  });
});
</script>
