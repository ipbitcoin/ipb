<template>
  <div class="relative flex min-h-screen flex-col bg-white text-neutral-950">
    <a
      href="#main"
      class="sr-only rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {{ $t("nav.skip") }}
    </a>

    <header class="sticky top-0 z-50">
      <!-- The frosted backdrop lives on its own layer: `backdrop-filter` on the
           header itself would trap the fixed mobile sheet inside it. -->
      <div
        aria-hidden="true"
        :class="[
          'absolute inset-0 -z-10 border-b bg-white/85 backdrop-blur-xl backdrop-saturate-150 transition-[border-color] duration-200 ease-out',
          isScrolled || isMenuOpen ? 'border-black/10' : 'border-transparent',
        ]"
      />
      <div class="section flex h-16 items-center justify-between gap-6 xl:h-19">
        <IPBBrandMenu>
          <NuxtLink
            :to="localePath('index')"
            aria-label="Instituto Português de Bitcoin"
            class="focus-ring -m-1 rounded-md p-1"
          >
            <IPBLogo class="h-10 w-auto xl:h-12" />
          </NuxtLink>
        </IPBBrandMenu>

        <nav :aria-label="$t('nav.main')" class="hidden xl:block">
          <ul class="flex items-center gap-1">
            <li v-for="item in NAV_ITEMS" :key="item.key">
              <NuxtLink
                :to="navTarget(item)"
                :aria-current="isCurrent(item) ? 'page' : undefined"
                :data-active="isActive(item) || undefined"
                class="group/nav relative flex h-9 items-center rounded-full px-3 text-sm font-medium text-neutral-600 transition-[background-color,color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-black/4 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-active:text-neutral-950"
              >
                {{ $t(item.label) }}
                <!-- A single orange block marks the section you are in -->
                <span
                  aria-hidden="true"
                  class="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 bg-brand opacity-0 transition-opacity duration-150 ease-out group-data-active/nav:opacity-100"
                />
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="flex items-center gap-3">
          <IPBLanguageSelector class="hidden sm:inline-flex" />
          <UiButton
            :to="localePath('juntar')"
            arrow
            class="hidden sm:inline-flex"
          >
            {{ $t("nav.donations") }}
          </UiButton>

          <button
            ref="menuButton"
            type="button"
            class="relative -mr-2 grid size-10 cursor-pointer place-items-center rounded-full transition-[background-color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:hidden"
            :aria-label="$t('nav.menu')"
            :aria-expanded="isMenuOpen"
            aria-controls="mobile-menu"
            @click="isMenuOpen = !isMenuOpen"
          >
            <!-- Both icons stay mounted so the swap cross-fades both ways -->
            <IconClose
              :class="[
                'col-start-1 row-start-1 size-6 transition-[opacity,scale,filter] duration-300 ease-swap',
                isMenuOpen
                  ? 'opacity-100'
                  : 'opacity-0 motion-safe:scale-25 motion-safe:blur-xs',
              ]"
            />
            <IconMenu
              :class="[
                'col-start-1 row-start-1 size-6 transition-[opacity,scale,filter] duration-300 ease-swap',
                isMenuOpen
                  ? 'opacity-0 motion-safe:scale-25 motion-safe:blur-xs'
                  : 'opacity-100',
              ]"
            />
          </button>
        </div>
      </div>
    </header>

    <Transition
      enter-active-class="transition-[opacity,translate] duration-200 ease-out"
      enter-from-class="opacity-0 motion-safe:-translate-y-3"
      leave-active-class="transition-[opacity,translate] duration-150 ease-out"
      leave-to-class="opacity-0 motion-safe:-translate-y-3"
    >
      <div
        v-show="isMenuOpen"
        id="mobile-menu"
        class="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-white xl:hidden"
      >
        <nav :aria-label="$t('nav.main')" class="section flex-1 pt-4">
          <ul class="flex flex-col">
            <li
              v-for="item in NAV_ITEMS"
              :key="item.key"
              class="border-b border-black/10"
            >
              <NuxtLink
                :to="navTarget(item)"
                :aria-current="isCurrent(item) ? 'page' : undefined"
                class="group/item flex items-center justify-between py-4 text-3xl font-normal tracking-[-0.03em] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                @click="closeMenu"
              >
                {{ $t(item.label) }}
                <span
                  aria-hidden="true"
                  :class="[
                    'size-2 bg-brand transition-opacity duration-150 ease-out',
                    isActive(item) ? 'opacity-100' : 'opacity-0',
                  ]"
                />
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div
          class="section flex flex-col gap-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
        >
          <UiButton
            :to="localePath('juntar')"
            arrow
            size="lg"
            class="w-full justify-between"
            @click="closeMenu"
          >
            {{ $t("nav.donations") }}
          </UiButton>
          <div class="flex items-center justify-between">
            <IPBLanguageSelector />
            <ul class="flex items-center gap-1">
              <li v-for="social in SOCIALS" :key="social.label">
                <NuxtLink
                  :to="social.href"
                  target="_blank"
                  external
                  :aria-label="social.label"
                  class="grid size-10 place-items-center rounded-full text-neutral-600 transition-[background-color,color] duration-150 ease-out hover:bg-black/5 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <component :is="social.icon" class="size-5" />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>

    <main
      id="main"
      tabindex="-1"
      class="grow outline-none"
      :inert="isMenuOpen ? true : undefined"
    >
      <slot />
    </main>

    <footer
      class="relative w-full overflow-hidden bg-neutral-950 text-white"
      :inert="isMenuOpen ? true : undefined"
    >
      <IPBFooterArt />

      <div class="section relative z-10 pt-20 pb-10 sm:pt-24">
        <div class="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <!-- Newsletter leads: it is the one action we want here -->
          <div class="flex flex-col gap-6 lg:col-span-5">
            <p class="eyebrow text-white/50">
              {{ $t("newsletter.footerLabel") }}
            </p>
            <p
              class="max-w-sm text-3xl leading-[1.1] font-normal tracking-[-0.03em] text-balance"
            >
              {{ $t("newsletter.descriptionFooter") }}
            </p>
            <IPBNewsletterForm tone="dark" />
          </div>

          <div
            class="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7"
          >
            <div class="flex flex-col gap-5">
              <h2 :class="footerHeadingClass">{{ $t("nav.research") }}</h2>
              <ul class="flex flex-col gap-3">
                <li>
                  <NuxtLink
                    :class="footerLinkClass"
                    :to="localePath('investigacao')"
                  >
                    {{ $t("common.seeAll") }}
                  </NuxtLink>
                </li>
                <li v-for="category in researchCategories" :key="category.slug">
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

            <div class="flex flex-col gap-5">
              <h2 :class="footerHeadingClass">{{ $t("nav.education") }}</h2>
              <ul class="flex flex-col gap-3">
                <li>
                  <NuxtLink
                    :class="footerLinkClass"
                    :to="localePath('educacao')"
                  >
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

            <div class="flex flex-col gap-5">
              <h2 :class="footerHeadingClass">{{ $t("nav.information") }}</h2>
              <ul class="flex flex-col gap-3">
                <li>
                  <NuxtLink
                    :class="footerLinkClass"
                    :to="localePath('noticias')"
                  >
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
                    :href="ASSOCIATION_PDF"
                    target="_blank"
                  >
                    {{ $t("nav.association") }}
                  </a>
                </li>
                <li>
                  <a
                    :class="footerLinkClass"
                    :href="REGULATIONS_PDF"
                    target="_blank"
                  >
                    {{ $t("nav.regulations") }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          class="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8"
        >
          <p class="font-mono text-xs text-white/50">
            &copy; {{ year }} Instituto Português de Bitcoin
          </p>
          <div class="flex items-center gap-4">
            <ul class="flex items-center gap-1">
              <li v-for="social in SOCIALS" :key="social.label">
                <NuxtLink
                  :to="social.href"
                  target="_blank"
                  external
                  :aria-label="social.label"
                  class="grid size-9 place-items-center rounded-full text-white/60 transition-[background-color,color] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <component :is="social.icon" class="size-4" />
                </NuxtLink>
              </li>
            </ul>
            <IPBLanguageSelector tone="dark" />
          </div>
        </div>
      </div>

      <!-- Oversized wordmark, sitting on the bottom edge. -->
      <div aria-hidden="true" class="section relative z-10 pb-8">
        <IPBLogoInverse class="h-auto w-full opacity-[0.14]" />
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
];

// File names with spaces and accents must be percent-encoded in an href.
const ASSOCIATION_PDF = "/20251030L092F069-071vCnsttcAsscc.pdf";
const REGULATIONS_PDF = encodeURI(
  "/Regulamento Interno - Instituto Português de Bitcoin.pdf"
);

const footerLinkClass =
  "w-fit rounded-sm text-[15px] text-white/70 transition-colors duration-150 ease-out hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const footerHeadingClass =
  "font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/50";

const localePath = useLocalePath();
const routeBaseName = useRouteBaseName();
const { locale } = useI18n();
const { y } = useWindowScroll();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();
const isMounted = useMounted();
const year = new Date().getFullYear();

function navTarget(item: NavItem) {
  if (item.hash) {
    return localePath({ path: "/", hash: item.hash });
  }
  return localePath(item.route ?? "index");
}

const currentRouteName = computed(() => String(routeBaseName(route) ?? ""));

/** Exactly on the item's page (hash items never claim the home page). */
function isCurrent(item: NavItem) {
  return Boolean(item.route) && currentRouteName.value === item.route;
}

/** On the item's page or one of its sub-pages, e.g. a research category. */
function isActive(item: NavItem) {
  return (
    Boolean(item.route) &&
    (currentRouteName.value === item.route ||
      currentRouteName.value.startsWith(`${item.route}-`))
  );
}

// Hreflang alternate links for bilingual SEO (PT/EN)
const i18nHead = useLocaleHead({ seo: true });
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

// Read after mount only, so the server and client agree on first render.
const isScrolled = computed(() => isMounted.value && y.value > 8);

const isMenuOpen = ref(false);
const menuButton = useTemplateRef<HTMLButtonElement>("menuButton");
const isDesktop = useMediaQuery("(min-width: 1280px)");

function closeMenu() {
  isMenuOpen.value = false;
}

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

onKeyStroke("Escape", () => {
  if (isMenuOpen.value) {
    closeMenu();
    menuButton.value?.focus();
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

const researchCategories = computed(
  () => categories.value?.filter((c) => c.type === "research") ?? []
);

watch(() => route.path, closeMenu);

// The desktop nav replaces the sheet; never leave it open behind it.
watch(isDesktop, (desktop) => {
  if (desktop) {
    closeMenu();
  }
});

watch(locale, () => {
  refresh();
});
</script>
