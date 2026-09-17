<template>
  <section id="partners" class="section section-gap">
    <p class="eyebrow">{{ $t("partners.eyebrow") }}</p>
    <h2 class="section-title mt-4">{{ $t("partners.title") }}</h2>

    <IPBSkeleton v-if="pending" variant="text" :count="2" class="mt-10" />

    <template v-else-if="partners?.length">
      <!-- Track holds two identical halves; -50% lands exactly on the seam.
           Hovering anywhere pauses it; the hovered logo alone colours up. -->
      <div
        aria-hidden="true"
        class="marquee-mask group relative mt-10 overflow-hidden"
      >
        <div
          class="marquee-track flex w-max items-center group-hover:[animation-play-state:paused]"
        >
          <div
            v-for="(partner, index) in loopedPartners"
            :key="`${partner.documentId}-${index}`"
            class="group/logo relative flex h-20 w-44 shrink-0 flex-col items-center justify-center sm:w-56"
          >
            <img
              :src="partner.logo.url"
              :alt="partner.name"
              loading="lazy"
              class="max-h-10 w-auto max-w-[150px] object-contain opacity-40 grayscale transition-[opacity,filter] duration-300 ease-out group-hover/logo:opacity-100 group-hover/logo:grayscale-0"
            />
            <span
              class="pointer-events-none absolute bottom-0 text-[10px] tracking-[0.14em] whitespace-nowrap text-black/45 uppercase opacity-0 transition-opacity duration-300 ease-out group-hover/logo:opacity-100"
            >
              {{ partner.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Real, reachable list: the strip above is decorative -->
      <ul class="sr-only">
        <li v-for="partner in partners" :key="partner.documentId">
          <a v-if="partner.link" :href="partner.link">{{ partner.name }}</a>
          <span v-else>{{ partner.name }}</span>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
interface PartnerItem {
  documentId: string;
  name: string;
  link?: string | null;
  logo: { url: string };
}

const props = defineProps<{
  partners: PartnerItem[] | null | undefined;
  pending?: boolean;
}>();

/** Enough logos that one half always overflows the container, so the loop
 *  never shows a gap. Then duplicated for the seamless -50% wrap. */
const loopedPartners = computed(() => {
  const list = props.partners ?? [];
  if (list.length === 0) {
    return [];
  }
  const half = [...list];
  while (half.length < 8) {
    half.push(...list);
  }
  return [...half, ...half];
});
</script>

<style scoped>
.marquee-track {
  animation: var(--animate-marquee);
}

/* Logos dissolve into the page at both edges rather than being clipped. */
.marquee-mask {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 12%,
    #000 88%,
    transparent 100%
  );
}
</style>
