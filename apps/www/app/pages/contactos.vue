<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('contacts.eyebrow')"
      :title="$t('nav.contacts')"
      :description="$t('contacts.description')"
    />

    <div class="section pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div
        class="grid gap-x-16 gap-y-14 border-t border-black/10 pt-10 sm:pt-12 lg:grid-cols-12"
      >
        <section
          aria-labelledby="contact-email"
          class="flex flex-col items-start gap-6 lg:col-span-7"
        >
          <h2 id="contact-email" class="eyebrow">{{ $t("contacts.email") }}</h2>
          <a
            :href="`mailto:${CONTACT_EMAIL}`"
            class="link text-2xl leading-tight tracking-tight wrap-anywhere sm:text-4xl"
          >
            {{ CONTACT_EMAIL }}
          </a>
          <UiButton variant="outline" class="pl-3.5" @click="copyEmail">
            <!-- Both icons stay mounted so the swap cross-fades. -->
            <span class="grid" aria-hidden="true">
              <IconCheck
                class="size-4 transition-[opacity,filter,scale] duration-300 ease-swap [grid-area:1/1]"
                :class="copied ? SWAP_IN : SWAP_OUT"
              />
              <IconClipboard
                class="size-4 transition-[opacity,filter,scale] duration-300 ease-swap [grid-area:1/1]"
                :class="copied ? SWAP_OUT : SWAP_IN"
              />
            </span>
            {{ $t("contacts.copy") }}
          </UiButton>
          <span class="sr-only" aria-live="polite">
            {{ copied ? $t("contacts.copied") : "" }}
          </span>
        </section>

        <section
          aria-labelledby="contact-social"
          class="flex flex-col gap-6 lg:col-span-5"
        >
          <h2 id="contact-social" class="eyebrow">
            {{ $t("contacts.social") }}
          </h2>
          <ul class="border-t border-black/10">
            <li
              v-for="social in SOCIALS"
              :key="social.label"
              class="border-b border-black/10"
            >
              <a
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                class="group/social flex items-center gap-4 rounded-sm py-4 [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-full border border-black/15 bg-white shadow-button-light transition-[border-color] duration-150 ease-out group-hover/social:border-black/30"
                >
                  <component :is="social.icon" class="size-4" />
                </span>
                <span class="flex min-w-0 flex-col">
                  <span class="font-medium">{{ social.label }}</span>
                  <span class="truncate text-sm text-neutral-500">
                    {{ social.handle }}
                  </span>
                </span>
                <IconArrow
                  class="ms-auto size-4 shrink-0 -rotate-45 text-neutral-400 transition-[color,translate] duration-150 ease-out group-hover/social:text-neutral-950 motion-safe:group-hover/social:translate-x-0.5 motion-safe:group-hover/social:-translate-y-0.5"
                />
                <span class="sr-only">({{ $t("common.newTab") }})</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appLocale = useAppLocale();

const SWAP_IN = "opacity-100 motion-safe:scale-100 motion-safe:blur-[0px]";
const SWAP_OUT = "opacity-0 motion-safe:scale-25 motion-safe:blur-xs";

const SEO = {
  en: {
    description: `Get in touch with the Portuguese Bitcoin Institute. Email: ${CONTACT_EMAIL}`,
    title: "Contacts",
  },
  pt: {
    description: `Entre em contacto com o Instituto Português de Bitcoin. Email: ${CONTACT_EMAIL}`,
    title: "Contactos",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.title} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.title} | IPB`,
});

// Tells search engines this is the page to reach the institute.
useSchemaOrg([defineWebPage({ "@type": "ContactPage" })]);

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
  } catch {
    // Clipboard access denied: the address stays on screen to copy by hand.
    return;
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onBeforeUnmount(() => clearTimeout(copiedTimer));
</script>
