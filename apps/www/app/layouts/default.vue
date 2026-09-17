<template>
  <div class="relative flex min-h-screen flex-col">
    <header class="border-b border-black/10">
      <nav
        class="relative mx-auto flex h-20 w-full max-w-screen-xl items-center justify-between px-8"
      >
        <NuxtLink
          :to="localePath('index')"
          class="focus-ring absolute top-0 left-0 rounded bg-white px-6"
        >
          <IPBLogo class="w-[180px]" />
        </NuxtLink>
        <div></div>
        <ul class="hidden items-center gap-8 xl:flex">
          <li v-for="item in NAV_ITEMS" :key="item.key">
            <NuxtLink :to="navTarget(item)" :class="navLinkClass">
              {{ $t(item.label) }}
            </NuxtLink>
          </li>
          <li>
            <UiButton size="lg" :to="localePath('juntar')">{{
              $t("nav.donations")
            }}</UiButton>
          </li>
        </ul>

        <button
          class="focus-ring relative flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 ease-out hover:bg-black/5 xl:hidden"
          :aria-label="$t('nav.menu')"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-menu"
          @click="isMenuOpen = !isMenuOpen"
        >
          <!-- Both icons stay mounted so the swap cross-fades both ways -->
          <IconClose
            class="absolute size-8 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
            :class="
              isMenuOpen
                ? 'scale-100 opacity-100 blur-0'
                : 'scale-[0.25] opacity-0 blur-[4px]'
            "
          />
          <IconMenu
            class="size-8 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
            :class="
              isMenuOpen
                ? 'scale-[0.25] opacity-0 blur-[4px]'
                : 'scale-100 opacity-100 blur-0'
            "
          />
        </button>

        <Transition
          enter-active-class="transition-[opacity,translate] duration-200 ease-out"
          enter-from-class="-translate-y-3 opacity-0"
          leave-active-class="transition-[opacity,translate] duration-150 ease-out"
          leave-to-class="-translate-y-3 opacity-0"
        >
          <div
            v-show="isMenuOpen"
            id="mobile-menu"
            class="fixed top-[120px] left-0 z-40 h-fit min-h-screen w-full rounded-b-md border-t border-black/10 bg-white pt-4 pb-12 lg:border-t-0 lg:pt-0"
          >
            <ul
              class="mx-auto mt-4 flex w-full max-w-screen-xl flex-col items-center gap-8 px-8"
            >
              <li v-for="item in NAV_ITEMS" :key="item.key">
                <NuxtLink :to="navTarget(item)" :class="navLinkClass">
                  {{ $t(item.label) }}
                </NuxtLink>
              </li>
              <li>
                <UiButton size="lg" :to="localePath('juntar')">{{
                  $t("nav.donations")
                }}</UiButton>
              </li>
            </ul>
          </div>
        </Transition>
      </nav>
    </header>

    <div class="flex-grow">
      <slot />
    </div>

    <footer class="w-full bg-black tracking-wider text-white">
      <div class="mx-auto flex max-w-screen-xl flex-col p-8">
        <div class="flex items-center justify-between">
          <IPBLogoInverse class="w-[180px]" />
          <IPBLanguageSelector />
        </div>
        <div class="flex flex-col justify-between gap-8 lg:flex-row">
          <div class="flex flex-col gap-2">
            <NuxtLink
              class="w-fit rounded font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              :to="localePath('investigacao')"
              >{{ $t("nav.research") }}</NuxtLink
            >
            <ul class="flex flex-col gap-2">
              <li
                v-for="category in categories?.filter(
                  (c) => c.type === 'research'
                )"
                :key="category.slug"
              >
                <NuxtLink
                  :class="footerLinkClass"
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
                class="w-fit rounded font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                :to="localePath('educacao')"
                >{{ $t("nav.education") }}</NuxtLink
              >
              <NuxtLink
                :class="footerLinkClass"
                :to="localePath('formacoes')"
                >{{ $t("nav.training") }}</NuxtLink
              >
              <NuxtLink
                :class="footerLinkClass"
                to="https://bitcoin.org/bitcoin.pdf"
                external
                >Whitepaper</NuxtLink
              >
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink
                class="w-fit rounded font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                :to="localePath('noticias')"
                >{{ $t("nav.news") }}</NuxtLink
              >
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <h3 class="font-bold uppercase">{{ $t("nav.information") }}</h3>
            <ul class="flex flex-col gap-2">
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  :to="localePath('manifesto')"
                >
                  {{ $t("nav.manifest") }}
                </NuxtLink>
              </li>
              <li>
                <a
                  :class="footerLinkClass"
                  href="/20251030L092F069-071vCnsttcAsscc.pdf"
                  target="_blank"
                >
                  {{ $t("nav.association") }}
                </a>
              </li>
              <li>
                <a
                  :class="footerLinkClass"
                  href="/Regulamento Interno - Instituto Português de Bitcoin.pdf"
                  target="_blank"
                >
                  {{ $t("nav.regulations") }}
                </a>
              </li>
              <li>
                <NuxtLink :class="footerLinkClass" :to="localePath('equipa')">
                  {{ $t("nav.team") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink :class="footerLinkClass" :to="localePath('juntar')">
                  {{ $t("nav.donations") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  :to="localePath('contactos')"
                >
                  {{ $t("nav.contacts") }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="flex flex-col gap-6">
            <form class="flex flex-col gap-2" @submit.prevent="handleSubscribe">
              <span>{{ $t("newsletter.descriptionFooter") }}</span>
              <div class="flex flex-col gap-2 sm:flex-row">
                <UiTextInput
                  v-model="newsletterEmail"
                  variant="inverse"
                  type="email"
                  required
                  :placeholder="t('input.email')"
                  :aria-label="t('input.email')"
                  class="w-full sm:w-fit"
                />
                <UiButton variant="inverse" :loading="loading">{{
                  $t("newsletter.cta")
                }}</UiButton>
              </div>
            </form>
            <ul class="flex items-center gap-3">
              <li>
                <NuxtLink
                  to="https://x.com/ipbitcoin"
                  target="_blank"
                  external
                  aria-label="X"
                  class="block rounded transition-opacity duration-150 ease-out hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <IconX class="size-6" />
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="https://www.linkedin.com/company/instituto-portugues-de-bitcoin/"
                  target="_blank"
                  external
                  aria-label="LinkedIn"
                  class="block rounded transition-opacity duration-150 ease-out hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

interface NavItem {
  key: string;
  label: string;
  /** Route name, or a hash target on the home page. */
  route?: string;
  hash?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "manifest", label: "nav.manifest", route: "manifesto" },
  { key: "news", label: "nav.news", route: "noticias" },
  { key: "research", label: "nav.research", route: "investigacao" },
  { key: "education", label: "nav.education", route: "educacao" },
  { key: "training", label: "nav.training", route: "formacoes" },
  { key: "faq", label: "nav.faq", hash: "#faq" },
  { key: "team", label: "nav.team", route: "equipa" },
];

// Underline is always present, transparent until hover: no layout shift.
const navLinkClass =
  "focus-ring rounded font-medium uppercase tracking-wider underline decoration-transparent decoration-1 underline-offset-2 transition-[text-decoration-color] duration-150 ease-out hover:decoration-current";

const footerLinkClass =
  "w-fit rounded underline decoration-transparent underline-offset-2 transition-[text-decoration-color] duration-150 ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const localePath = useLocalePath();
const { t, locale } = useI18n();
const { y } = useWindowScroll();
const { subscribe, loading } = useNewsletter();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();

function navTarget(item: NavItem) {
  if (item.hash) {
    return localePath({ path: "/", hash: item.hash });
  }
  return localePath(item.route ?? "index");
}

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

// The open menu covers the viewport; freeze the page behind it.
watch(isMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? "hidden" : "";
  }
});
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = "";
  }
});

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
