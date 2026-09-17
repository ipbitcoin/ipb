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

    <footer class="relative w-full overflow-hidden bg-black text-white">
      <IPBFooterArt />

      <div class="section relative z-10 pt-16 pb-10 sm:pt-20">
        <div class="grid gap-12 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
          <!-- Newsletter leads: it is the one action we want here -->
          <div class="flex flex-col gap-5">
            <p
              class="text-xs font-medium tracking-[0.18em] text-white/40 uppercase"
            >
              {{ $t("newsletter.footerLabel") }}
            </p>
            <p class="max-w-xs text-lg text-balance text-white/70">
              {{ $t("newsletter.descriptionFooter") }}
            </p>
            <IPBNewsletterForm inverse />
          </div>

          <div class="flex flex-col gap-4">
            <h3 :class="footerHeadingClass">{{ $t("nav.research") }}</h3>
            <ul class="flex flex-col gap-3">
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  :to="localePath('investigacao')"
                >
                  {{ $t("common.seeAll") }}
                </NuxtLink>
              </li>
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
            <h3 :class="footerHeadingClass">{{ $t("nav.education") }}</h3>
            <ul class="flex flex-col gap-3">
              <li>
                <NuxtLink :class="footerLinkClass" :to="localePath('educacao')">
                  {{ $t("nav.education") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  :to="localePath('formacoes')"
                >
                  {{ $t("nav.training") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  to="https://bitcoin.org/bitcoin.pdf"
                  external
                  target="_blank"
                >
                  Whitepaper
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-4">
            <h3 :class="footerHeadingClass">{{ $t("nav.information") }}</h3>
            <ul class="flex flex-col gap-3">
              <li>
                <NuxtLink :class="footerLinkClass" :to="localePath('noticias')">
                  {{ $t("nav.news") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :class="footerLinkClass"
                  :to="localePath('manifesto')"
                >
                  {{ $t("nav.manifest") }}
                </NuxtLink>
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
            </ul>
          </div>
        </div>

        <div
          class="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-white/15 pt-8"
        >
          <p class="text-sm text-white/40">
            &copy; {{ new Date().getFullYear() }} Instituto Português de Bitcoin
          </p>
          <div class="flex items-center gap-6">
            <ul class="flex items-center gap-4">
              <li>
                <NuxtLink
                  to="https://x.com/ipbitcoin"
                  target="_blank"
                  external
                  aria-label="X"
                  class="block rounded text-white/60 transition-colors duration-150 ease-out hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <IconX class="size-5" />
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="https://www.linkedin.com/company/instituto-portugues-de-bitcoin/"
                  target="_blank"
                  external
                  aria-label="LinkedIn"
                  class="block rounded text-white/60 transition-colors duration-150 ease-out hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <IconLinkedIn class="size-5" />
                </NuxtLink>
              </li>
            </ul>
            <IPBLanguageSelector />
          </div>
        </div>
      </div>

      <!-- Oversized wordmark. Fully visible, sitting on the bottom edge. -->
      <div
        aria-hidden="true"
        class="relative z-10 w-full overflow-hidden px-6 pb-8 sm:px-8"
      >
        <IPBLogoInverse class="w-full opacity-[0.16]" />
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
  "w-fit rounded text-sm text-white/60 transition-colors duration-150 ease-out hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const footerHeadingClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-white/40";

const localePath = useLocalePath();
const { locale } = useI18n();
const { y } = useWindowScroll();
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

// Lazy: the footer link list must never hold up a route change.
const { data: categories, refresh } = useAsyncData(
  `categories-${locale.value}`,
  () =>
    convex.query(api.categories.list, {
      locale: appLocale.value,
    }),
  { lazy: true }
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
