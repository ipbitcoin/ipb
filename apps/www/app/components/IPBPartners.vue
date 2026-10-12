<template>
  <!-- Few partners, so each one gets a real, linked tile instead of a
       scrolling strip that repeats the same three logos. -->
  <section
    id="partners"
    :aria-labelledby="headingId"
    class="section section-gap"
  >
    <div class="flex max-w-3xl flex-col gap-4">
      <p class="eyebrow">{{ $t("partners.eyebrow") }}</p>
      <h2 :id="headingId" class="section-title">{{ $t("partners.title") }}</h2>
      <p class="lead mt-1 max-w-2xl">{{ $t("partners.description") }}</p>
    </div>

    <ul
      v-if="pending"
      aria-hidden="true"
      class="mt-12 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3"
    >
      <li v-for="n in 3" :key="n" class="flex flex-col gap-4">
        <div
          class="h-32 animate-pulse rounded-2xl bg-black/5 [animation-duration:1.6s] motion-reduce:animate-none sm:h-40"
        />
        <div
          class="h-5 w-32 animate-pulse rounded bg-black/5 [animation-duration:1.6s] motion-reduce:animate-none"
        />
      </li>
    </ul>

    <ul
      v-else-if="partners?.length"
      class="mt-12 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3"
    >
      <li
        v-for="(partner, index) in partners"
        :key="partner.documentId"
        class="reveal"
        :style="{ '--reveal-delay': `${(index % 3) * 100}ms` }"
      >
        <component
          :is="partner.link ? 'a' : 'div'"
          :href="partner.link || undefined"
          :target="partner.link ? '_blank' : undefined"
          :rel="partner.link ? 'noopener' : undefined"
          class="group/partner flex flex-col gap-4 rounded-2xl [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <!-- Logos keep their own colours: a grey wash would erase the
               lighter ones. The name below carries the meaning. -->
          <span
            class="grid h-32 place-items-center overflow-hidden rounded-2xl border border-transparent bg-white px-8 shadow-border transition-[box-shadow] duration-150 ease-out group-hover/partner:shadow-border-hover sm:h-40"
          >
            <img
              :src="partner.logo.url"
              alt=""
              loading="lazy"
              decoding="async"
              class="max-h-14 w-auto max-w-full object-contain transition-[scale] duration-300 ease-out motion-safe:group-hover/partner:scale-[1.04] sm:max-h-16"
            />
          </span>
          <span class="flex items-baseline justify-between gap-4 px-1">
            <span class="font-medium tracking-[-0.01em]">{{
              partner.name
            }}</span>
            <span
              v-if="partner.link"
              class="flex shrink-0 items-center gap-1.5 font-mono text-[11px] leading-4 text-neutral-500 transition-[color] duration-150 ease-out group-hover/partner:text-neutral-950"
            >
              {{ hostname(partner.link) }}
              <IconArrow
                class="size-3 -rotate-45 transition-[translate] duration-150 ease-out motion-safe:group-hover/partner:translate-x-0.5 motion-safe:group-hover/partner:-translate-y-0.5"
              />
              <span class="sr-only">({{ $t("common.newTab") }})</span>
            </span>
          </span>
        </component>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
interface PartnerItem {
  documentId: string;
  name: string;
  link?: string | null;
  logo: { url: string };
}

defineProps<{
  partners: PartnerItem[] | null | undefined;
  pending?: boolean;
}>();

const headingId = useId();

/** "https://www.example.org/path" → "example.org" */
function hostname(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}
</script>
