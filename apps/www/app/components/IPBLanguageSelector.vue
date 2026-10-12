<template>
  <!-- Real links, so crawlers and no-JS visitors can reach the other
       language; the click still goes through setLocale for the cookie. -->
  <div
    role="group"
    :aria-label="t('nav.language')"
    :class="[
      'inline-flex items-center rounded-full p-0.5 font-mono text-[11px] leading-none font-medium tracking-[0.08em]',
      tone === 'dark' ? 'bg-white/10' : 'bg-black/5',
    ]"
  >
    <template v-for="option in OPTIONS" :key="option.code">
      <SlpStart :locale="option.code" />
      <a
        :href="hrefs[option.code]"
        :hreflang="option.code"
        :lang="option.code"
        :aria-current="locale === option.code ? 'true' : undefined"
        :aria-label="option.label"
        data-allow-mismatch="attribute"
        :class="[
          'rounded-full px-2.5 py-1.5 transition-[background-color,color,box-shadow] duration-150 ease-out [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2',
          tone === 'dark'
            ? 'focus-visible:outline-white'
            : 'focus-visible:outline-brand',
          locale === option.code
            ? tone === 'dark'
              ? 'bg-white text-neutral-950'
              : 'bg-white text-neutral-950 shadow-button-light'
            : tone === 'dark'
              ? 'text-white/60 hover:text-white'
              : 'text-neutral-500 hover:text-neutral-950',
        ]"
        @click="select($event, option.code)"
      >
        {{ option.short }}
      </a>
      <SlpEnd />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Comment, h } from "vue";

withDefaults(defineProps<{ tone?: "light" | "dark" }>(), { tone: "light" });

const { locale, setLocale, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const nuxtApp = useNuxtApp();

const OPTIONS = [
  { code: "pt", label: "Português", short: "PT" },
  { code: "en", label: "English", short: "EN" },
] as const;

type LocaleCode = (typeof OPTIONS)[number]["code"];

// Articles and research categories have a different slug per language. Their
// pages hand both to useSetI18nParams during setup, which runs after this
// header has rendered:
// - on the server, @nuxtjs/i18n rewrites the href between these markers once
//   the whole page is rendered (the markers <SwitchLocalePathLink> uses);
// - in the browser, the links are resolved again when each page is in.
const SlpStart = (props: { locale: string }) =>
  h(Comment, `nuxt-i18n-slp-[${props.locale}]`);
const SlpEnd = () => h(Comment, "/nuxt-i18n-slp");

const revision = ref(0);
function refresh() {
  revision.value += 1;
}
if (import.meta.client) {
  onMounted(refresh);
  onBeforeUnmount(nuxtApp.hook("page:finish", refresh));
}

const hrefs = computed(() => {
  void revision.value;
  return {
    en: switchLocalePath("en"),
    pt: switchLocalePath("pt"),
  } satisfies Record<LocaleCode, string>;
});

async function select(event: MouseEvent, code: LocaleCode) {
  // New tab or window: let the browser follow the real href.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  await setLocale(code);
}
</script>
