<template>
  <div>
    <main class="border-b">
      <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-8 px-8">
        <h1 class="text-5xl sm:text-7xl font-light max-w-3xl text-balance">
          {{ $t("main.header") }}
        </h1>
        <ul class="flex items-center gap-4">
          <li>
            <UiButton variant="outline" :to="localePath('manifesto')">{{
              $t("main.cta.readManifest")
            }}</UiButton>
          </li>
          <li>
            <UiButton variant="subtle" :to="localePath('juntar')">{{
              $t("main.cta.join")
            }}</UiButton>
          </li>
        </ul>
      </div>
    </main>
    <section id="newsletter" class="max-w-screen-xl mx-auto my-20">
      <form @submit.prevent="handleSubscribe" class="flex flex-col gap-4 px-8">
        <h2 class="font-light text-6xl">{{ $t("newsletter.title") }}</h2>
        <p class="max-w-2xl text-balance text-lg">
          {{ $t("newsletter.description") }}
        </p>
        <UiTextInput
          v-model="newsletterEmail"
          type="email"
          required
          :placeholder="t('input.email')"
          class="w-fit"
        />
        <UiButton class="w-fit" :loading="loading">{{
          $t("newsletter.cta")
        }}</UiButton>
      </form>
    </section>
    <section id="coins" class="my-20 border-b">
      <div
        class="grid grid-cols-1 place-items-center lg:place-items-start sm:grid-cols-2 lg:grid-cols-4 pb-10 lg:pb-0 gap-8 xl:gap-0 justify-between lg:overflow-hidden lg:h-[135px] max-w-screen-xl mx-auto px-8"
      >
        <motion.img
          src="/coin1.png"
          alt="Moeda Real"
          class="w-[250px] h-[250px] object-cover"
          :initial="{ opacity: 0 }"
          :while-in-view="{ opacity: 1 }"
          :in-view-options="{ once: true }"
          :transition="{ delay: 0.25 }"
        />
        <motion.img
          src="/coin2.png"
          alt="Moeda Escudo"
          class="w-[250px] h-[250px] object-cover"
          :initial="{ opacity: 0 }"
          :while-in-view="{ opacity: 1 }"
          :in-view-options="{ once: true }"
          :transition="{ delay: 0.5 }"
        />
        <motion.img
          src="/coin3.png"
          alt="Moeda Euro"
          class="w-[250px] h-[250px] object-cover"
          :initial="{ opacity: 0 }"
          :while-in-view="{ opacity: 1 }"
          :in-view-options="{ once: true }"
          :transition="{ delay: 0.75 }"
        />
        <motion.img
          src="/coin4.svg"
          alt="Bitcoin"
          class="w-[250px] h-[255px] object-cover"
          :initial="{ opacity: 0 }"
          :while-in-view="{ opacity: 1 }"
          :in-view-options="{ once: true }"
          :transition="{ delay: 1 }"
        />
      </div>
    </section>
    <section
      v-if="
        articles?.filter((a) => a.category?.type === 'news')?.length || 0 > 0
      "
      id="news"
      class="max-w-screen-xl mx-auto my-20"
    >
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("news.title") }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in articles?.filter(
              (a) => a.category?.type === 'news'
            )"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :image="article.main_image.url"
            :created-at="article.createdAt"
          />
        </div>
      </div>
    </section>
    <section id="values" class="max-w-screen-xl mx-auto my-20">
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("values.title") }}</h2>
        <ul
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
        >
          <li v-for="value in values" :key="value.title">
            <article class="flex flex-col gap-2">
              <h3 class="text-3xl font-light">{{ value.title }}</h3>
              <p class="text-balance text-lg">{{ value.description }}</p>
            </article>
          </li>
        </ul>
      </div>
    </section>
    <section
      v-if="partners && partners.length > 0"
      id="partners"
      class="border-t my-20 pt-8"
    >
      <div class="max-w-screen-xl mx-auto flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("partners.title") }}</h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8"
        >
          <IPBPartner
            v-for="partner in partners"
            :key="partner.name"
            :name="partner.name"
            :logo="partner.logo.url"
            :link="partner.link"
          />
        </div>
      </div>
    </section>
    <section id="research" class="max-w-screen-xl mx-auto my-20">
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("research.title") }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in articles?.filter(
              (a) => a.category?.type === 'research'
            )"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :category="article.category?.name"
            :image="article.main_image.url"
          />
        </div>
      </div>
    </section>
    <section id="education" class="max-w-screen-xl mx-auto my-20">
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("education.title") }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBArticleCard
            v-for="article in articles?.filter(
              (a) => a.category?.type === 'education'
            )"
            :key="article.documentId"
            :title="article.title"
            :slug="article.slug"
            :image="article.main_image.url"
          />
        </div>
      </div>
    </section>
    <section id="documents" class="max-w-screen-xl mx-auto my-20">
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("documents.title") }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <IPBDocumentCard
            v-for="doc in documents"
            :key="doc.documentId"
            :title="doc.title"
            :url="doc.document.url"
          />
        </div>
      </div>
    </section>
    <section id="faq" class="max-w-screen-xl mx-auto my-20">
      <div class="flex flex-col gap-8 px-8">
        <h2 class="font-light text-6xl">{{ $t("faq.title") }}</h2>
        <AccordionRoot :collapsible="true">
          <template v-for="(faq, index) in faqs" :key="faq.question">
            <AccordionItem
              :value="String(index)"
              class="first:border-t border-b border-gray-200 py-3"
            >
              <AccordionHeader>
                <AccordionTrigger
                  class="text-left flex flex-1 gap-2 cursor-pointer justify-between w-full group"
                >
                  <span class="font-bold"
                    >{{ index + 1 }}. {{ faq.question }}</span
                  >
                  <IconArrowDown
                    class="size-6 min-w-[1.5rem] min-h-[1.5rem] ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180"
                  />
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent
                class="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up max-w-3xl"
              >
                <div class="flex flex-col py-2 gap-2">
                  <p v-for="p in faq.answer.split('\n')" class="text-[#6a6a6b]">
                    {{ p }}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </template>
        </AccordionRoot>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";
import { motion } from "motion-v";

const localePath = useLocalePath();
const { locale, t } = useI18n();
const { subscribe, loading } = useNewsletter();
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

// FAQ Schema (server-sorted by order)
const { data: faqsForSchema } = useAsyncData(`faq-schema-${locale.value}`, () =>
  convex.query(api.faqs.list, { locale: currentLocale.value })
);

watchEffect(() => {
  if (!faqsForSchema.value?.length) {
    return;
  }
  useHead({
    script: [
      {
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqsForSchema.value.map(
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
        type: "application/ld+json",
      },
    ],
  });
});

const newsletterEmail = ref("");

async function handleSubscribe() {
  await subscribe(newsletterEmail);
}

// All lists come server-sorted (order asc / createdAt desc) from Convex
const { data: values } = useAsyncData(`values-${locale.value}`, () =>
  convex.query(api.values.list, { locale: currentLocale.value })
);

const { data: partners } = useAsyncData("partners", () =>
  convex.query(api.partners.list, {})
);

const { data: articles } = useAsyncData(`articles-${locale.value}`, () =>
  convex.query(api.articles.listPublished, { locale: currentLocale.value })
);

const { data: faqs } = useAsyncData(`faq-${locale.value}`, () =>
  convex.query(api.faqs.list, { locale: currentLocale.value })
);

const { data: documents } = useAsyncData(`documents-${locale.value}`, () =>
  convex.query(api.docs.list, { locale: currentLocale.value })
);
</script>
