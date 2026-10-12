<template>
  <section class="relative isolate overflow-hidden">
    <!-- A hairline ledger grid, fading out from the top right. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0_0_0/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0_0_0/0.05)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_60%_70%_at_85%_0%,black,transparent_75%)]"
    />

    <div class="section pt-10 sm:pt-16 lg:pt-20">
      <!-- The slot keeps its height while the latest article loads, so the
           headline never jumps when the pill arrives. -->
      <div class="enter flex h-8 items-center">
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
        >
          <NuxtLink
            v-if="latest"
            :to="
              localePath({ name: 'artigo-slug', params: { slug: latest.slug } })
            "
            class="group/pill inline-flex h-8 max-w-full min-w-0 items-center gap-2.5 rounded-full border border-transparent bg-white pr-3 pl-1 text-sm text-neutral-600 shadow-border transition-[box-shadow,color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:text-neutral-950 hover:shadow-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span
              class="shrink-0 rounded-full bg-neutral-950 px-2 py-1 font-mono text-[10px] leading-none font-medium tracking-[0.12em] text-white uppercase"
            >
              {{ $t("main.latest") }}
            </span>
            <span class="truncate">{{ latest.title }}</span>
            <IconArrow
              class="size-3.5 shrink-0 text-neutral-400 transition-[translate,color] duration-150 ease-out group-hover/pill:text-neutral-950 motion-safe:group-hover/pill:translate-x-0.5"
            />
          </NuxtLink>
        </Transition>
      </div>

      <!-- The headline enters as one piece with no delay: it is the LCP
           element, so it must not wait on anything. -->
      <h1
        class="enter mt-8 max-w-5xl text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] font-normal tracking-[-0.045em] text-balance sm:mt-10"
      >
        {{ $t("main.header") }}
      </h1>

      <p class="enter lead mt-6 max-w-xl sm:mt-8" style="--enter-delay: 100ms">
        {{ $t("main.subheader") }}
      </p>

      <div
        class="enter mt-9 flex flex-wrap items-center gap-3"
        style="--enter-delay: 200ms"
      >
        <UiButton size="lg" arrow :to="localePath('manifesto')">
          {{ $t("main.cta.readManifest") }}
        </UiButton>
        <UiButton size="lg" variant="outline" :to="localePath('juntar')">
          {{ $t("main.cta.join") }}
        </UiButton>
      </div>
    </div>

    <!-- Three centuries of Portuguese money, rising over the horizon one after
         another. The coins are decoration; the list below carries the meaning. -->
    <figure class="mt-14 sm:mt-20" :aria-label="$t('main.timeline.label')">
      <div
        aria-hidden="true"
        class="section grid grid-cols-4 gap-x-4 sm:gap-x-8"
      >
        <div
          v-for="(coin, index) in COINS"
          :key="coin.year"
          class="relative aspect-2/1 w-full max-w-44 overflow-hidden"
        >
          <img
            v-if="coin.vector"
            :src="coin.src"
            alt=""
            width="176"
            height="176"
            class="rise absolute inset-x-0 top-0 aspect-square w-full"
            :style="{ '--enter-delay': `${300 + index * 100}ms` }"
          />
          <NuxtImg
            v-else
            :src="coin.src"
            alt=""
            width="320"
            height="320"
            densities="x1"
            class="rise absolute inset-x-0 top-0 aspect-square w-full"
            :style="{ '--enter-delay': `${300 + index * 100}ms` }"
          />
        </div>
      </div>

      <div class="border-t border-black/10">
        <ol class="section grid grid-cols-4 gap-x-4 pt-4 sm:gap-x-8 sm:pt-5">
          <li
            v-for="(coin, index) in COINS"
            :key="coin.year"
            class="enter flex flex-col gap-1"
            :style="{ '--enter-delay': `${300 + index * 100}ms` }"
          >
            <span
              class="font-mono text-[11px] leading-4 text-neutral-500 tabular-nums"
            >
              {{ coin.year }}
            </span>
            <span
              class="flex items-center gap-2 text-sm font-medium tracking-[-0.01em] sm:text-base"
            >
              {{ $t(coin.label) }}
              <span
                v-if="coin.vector"
                aria-hidden="true"
                class="size-1.5 shrink-0 bg-brand"
              />
            </span>
          </li>
        </ol>
      </div>
    </figure>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  /** Newest published article, linked from the pill above the headline. */
  latest?: { slug: string; title: string } | null;
}>();

const localePath = useLocalePath();

const COINS = [
  { label: "main.timeline.gold", src: "/coin1.png", year: 1712 },
  { label: "main.timeline.escudo", src: "/coin2.png", year: 2000 },
  { label: "main.timeline.euro", src: "/coin3.png", year: 2002 },
  // Vector already: the image optimizer would only rasterize it.
  {
    label: "main.timeline.bitcoin",
    src: "/coin4.svg",
    vector: true,
    year: 2009,
  },
];
</script>
