<template>
  <section class="relative overflow-hidden border-b border-black/10">
    <!-- Height comes from the content, not the viewport: a tall hero on a
         short headline is just empty space above the fold. -->
    <div class="section flex flex-col justify-end pt-12 pb-0 sm:pt-16">
      <p class="reveal eyebrow">{{ $t("main.eyebrow") }}</p>

      <h1
        class="reveal mt-5 max-w-4xl text-5xl leading-[0.95] font-light tracking-tight text-balance sm:text-7xl lg:text-8xl"
        style="--reveal-delay: 80ms"
      >
        {{ $t("main.header") }}
      </h1>

      <p
        class="reveal mt-7 max-w-xl text-lg text-balance text-black/60"
        style="--reveal-delay: 160ms"
      >
        {{ $t("main.subheader") }}
      </p>

      <ul
        class="reveal mt-10 flex flex-wrap items-center gap-4"
        style="--reveal-delay: 240ms"
      >
        <li>
          <UiButton size="lg" :to="localePath('manifesto')">
            {{ $t("main.cta.readManifest") }}
          </UiButton>
        </li>
        <li>
          <UiButton size="lg" variant="outline" :to="localePath('juntar')">
            {{ $t("main.cta.join") }}
          </UiButton>
        </li>
      </ul>

      <!-- Coins sit on the hero's bottom edge and overlap the divider.
           Decorative: the headline already carries the meaning. -->
      <div
        aria-hidden="true"
        class="pointer-events-none mt-12 -mb-10 flex items-end justify-between gap-2 sm:-mb-14 lg:-mb-20"
      >
        <img
          v-for="(coin, index) in COINS"
          :key="coin"
          :src="coin"
          alt=""
          class="reveal-coin w-[22%] max-w-[170px] object-contain"
          :style="{ '--reveal-delay': `${360 + index * 90}ms` }"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath();

const COINS = ["/coin1.png", "/coin2.png", "/coin3.png", "/coin4.svg"];
</script>
