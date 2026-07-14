<template>
  <div class="min-h-screen flex flex-col relative">
    <header class="border-b">
      <nav
        class="relative flex items-center justify-between w-full max-w-screen-xl mx-auto h-20 px-8"
      >
        <NuxtLink
          :to="localePath('index')"
          class="absolute left-0 top-0 bg-white px-6"
        >
          <IPBLogo class="w-[180px]" />
        </NuxtLink>
        <div></div>
        <ul class="gap-8 items-center hidden xl:flex">
          <li>
            <NuxtLink
              :to="localePath('manifesto')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.manifest") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath('noticias')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.news") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath('investigacao')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.research") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath('educacao')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.education") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath('formacoes')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.training") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath({ path: '/', hash: '#faq' })"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.faq") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="localePath('equipa')"
              class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
            >
              {{ $t("nav.team") }}
            </NuxtLink>
          </li>
          <li>
            <UiButton size="lg" :to="localePath('juntar')">{{
              $t("nav.donations")
            }}</UiButton>
          </li>
        </ul>
        <button
          class="xl:hidden size-10 rounded-md flex items-center justify-center hover:bg-gray-100 duration-300 transition-colors"
          aria-label="Menu"
          @click="isMenuOpen = !isMenuOpen"
        >
          <IconMenu v-if="!isMenuOpen" class="size-8" />
          <IconClose v-else class="size-8" />
        </button>
        <div
          class="bg-white fixed left-0 top-[120px] z-40 h-fit min-h-screen w-full rounded-b-md border-t border-gray-200 pb-12 pt-4 lg:border-t-0 lg:pt-0"
          :class="{ hidden: !isMenuOpen }"
        >
          <ul
            class="mx-auto flex w-full max-w-screen-xl items-center px-8 flex-col gap-8 mt-4"
          >
            <li>
              <NuxtLink
                :to="localePath('manifesto')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.manifest") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('noticias')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.news") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('investigacao')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.research") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('educacao')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.education") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('formacoes')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.training") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath({ path: '/', hash: '#faq' })"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.faq") }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('equipa')"
                class="uppercase font-medium tracking-wider hover:underline underline-offset-2"
              >
                {{ $t("nav.team") }}
              </NuxtLink>
            </li>
            <li>
              <UiButton size="lg" :to="localePath('juntar')">{{
                $t("nav.donations")
              }}</UiButton>
            </li>
          </ul>
        </div>
      </nav>
    </header>
    <div class="flex-grow">
      <slot />
    </div>
    <footer class="w-full bg-black text-white tracking-wider">
      <div class="flex mx-auto max-w-screen-xl p-8 flex-col">
        <div class="flex items-center justify-between">
          <IPBLogoInverse class="w-[180px]" />
          <IPBLanguageSelector />
        </div>
        <div class="flex flex-col lg:flex-row gap-8 justify-between">
          <div class="flex flex-col gap-2">
            <NuxtLink
              class="uppercase font-bold w-fit"
              :to="localePath('investigacao')"
              >{{ $t("nav.research") }}</NuxtLink
            >
            <ul class="flex flex-col gap-2">
              <li
                v-for="category in categories?.filter(
                  (c) => c.type === 'research'
                )"
              >
                <NuxtLink
                  :to="
                    localePath({
                      name: 'investigacao-categoria',
                      params: { categoria: category.slug },
                    })
                  "
                >
                  {{ category.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <NuxtLink
                class="uppercase font-bold"
                :to="localePath('educacao')"
                >{{ $t("nav.education") }}</NuxtLink
              >
              <NuxtLink :to="localePath('formacoes')">{{
                $t("nav.training")
              }}</NuxtLink>
              <NuxtLink to="https://bitcoin.org/bitcoin.pdf" external
                >Whitepaper</NuxtLink
              >
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink
                class="uppercase font-bold"
                :to="localePath('noticias')"
                >{{ $t("nav.news") }}</NuxtLink
              >
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <h3 class="uppercase font-bold">{{ $t("nav.information") }}</h3>
            <ul class="flex flex-col gap-2">
              <li>
                <NuxtLink :to="localePath('manifesto')">
                  {{ $t("nav.manifest") }}
                </NuxtLink>
              </li>
              <li>
                <a href="/20251030L092F069-071vCnsttcAsscc.pdf" target="_blank">
                  {{ $t("nav.association") }}
                </a>
              </li>
              <li>
                <a
                  href="/Regulamento Interno - Instituto Português de Bitcoin.pdf"
                  target="_blank"
                >
                  {{ $t("nav.regulations") }}
                </a>
              </li>
              <li>
                <NuxtLink :to="localePath('equipa')">
                  {{ $t("nav.team") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink :to="localePath('juntar')">
                  {{ $t("nav.donations") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink :to="localePath('contactos')">
                  {{ $t("nav.contacts") }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="flex flex-col gap-6">
            <form @submit.prevent="handleSubscribe" class="flex flex-col gap-2">
              <span>{{ $t("newsletter.descriptionFooter") }}</span>
              <div class="flex gap-2 sm:flex-row flex-col">
                <UiTextInput
                  v-model="newsletterEmail"
                  variant="inverse"
                  type="email"
                  required
                  :placeholder="t('input.email')"
                  class="w-full sm:w-fit"
                />
                <UiButton variant="inverse" :loading="loading">{{
                  $t("newsletter.cta")
                }}</UiButton>
              </div>
            </form>
            <ul class="flex gap-3 items-center">
              <li>
                <NuxtLink to="https://x.com/ipbitcoin" target="_blank" external>
                  <IconX class="size-6" />
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="https://www.linkedin.com/company/instituto-portugues-de-bitcoin/"
                  target="_blank"
                  external
                >
                  <IconLinkedIn class="size-6" />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const localePath = useLocalePath();
const { t, locale } = useI18n();
const { y } = useWindowScroll();
const { subscribe, loading } = useNewsletter();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();

// Hreflang alternate links for bilingual SEO (PT/EN)
const i18nHead = useLocaleHead({ addSeoAttributes: true });
useHead(() => ({
  htmlAttrs: i18nHead.value?.htmlAttrs ?? {},
  link: [
    ...(i18nHead.value?.link ?? []),
    {
      href: "https://institutobitcoin.pt/rss.xml",
      rel: "alternate",
      title: "Instituto Português de Bitcoin — Artigos",
      type: "application/rss+xml",
    },
    {
      href: "https://institutobitcoin.pt/rss-en.xml",
      rel: "alternate",
      title: "Portuguese Bitcoin Institute — Articles",
      type: "application/rss+xml",
    },
  ],
  meta: [...(i18nHead.value?.meta ?? [])],
}));

const isMenuOpen = ref(false);

const newsletterEmail = ref("");

async function handleSubscribe() {
  await subscribe(newsletterEmail);
}

const { data: categories, refresh } = useAsyncData(
  `categories-${locale.value}`,
  () =>
    convex.query(api.categories.list, {
      locale: appLocale.value,
    })
);

watch(
  () => route.path,
  () => {
    isMenuOpen.value = false;
  }
);

watch(y, () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false;
  }
});

watch(locale, () => {
  refresh();
});
</script>
