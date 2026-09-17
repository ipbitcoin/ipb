<template>
  <section id="partners" class="section-gap border-t border-black/10">
    <div class="section">
      <p class="eyebrow">{{ $t("partners.eyebrow") }}</p>
      <h2 class="section-title mt-4">{{ $t("partners.title") }}</h2>
    </div>

    <IPBSkeleton
      v-if="pending"
      variant="text"
      :count="2"
      class="section mt-12"
    />

    <template v-else-if="partners?.length">
      <!-- Visual strip. Duplicated list + translateX(-50%) = seamless loop.
           Hovering anywhere pauses the whole track; the hovered logo alone
           returns to full colour and names itself. -->
      <div
        aria-hidden="true"
        class="group mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <div
          class="marquee-track flex w-max items-center gap-16 pr-16 group-hover:[animation-play-state:paused] sm:gap-24 sm:pr-24"
        >
          <div
            v-for="(partner, index) in loopedPartners"
            :key="`${partner.documentId}-${index}`"
            class="relative flex h-24 shrink-0 flex-col items-center justify-center"
          >
            <img
              :src="partner.logo.url"
              :alt="partner.name"
              loading="lazy"
              class="max-h-14 w-auto max-w-[180px] object-contain opacity-45 grayscale transition-[opacity,filter] duration-300 ease-out hover:opacity-100 hover:grayscale-0"
            />
            <span
              class="pointer-events-none absolute -bottom-1 text-[11px] tracking-[0.14em] text-black/50 uppercase opacity-0 transition-opacity duration-300 ease-out"
            >
              {{ partner.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Real, reachable list: the strip above is decorative -->
      <ul class="section sr-only">
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

// Two copies so the -50% keyframe lands exactly on the seam. Short lists get
// padded first, otherwise a couple of logos leave visible gaps mid-scroll.
const loopedPartners = computed(() => {
  const list = props.partners ?? [];
  if (list.length === 0) {
    return [];
  }
  const padded = [...list];
  while (padded.length < 6) {
    padded.push(...list);
  }
  return [...padded, ...padded];
});
</script>

<style scoped>
.marquee-track {
  animation: var(--animate-marquee);
}

/* Reveal the name alongside its own logo without a wrapper hover state */
.marquee-track > div:hover span {
  opacity: 1;
}
</style>
