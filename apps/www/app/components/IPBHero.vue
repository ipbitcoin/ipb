<template>
  <section class="relative overflow-hidden border-b border-black/10">
    <div
      class="section flex min-h-[78vh] flex-col justify-end pt-24 pb-0 sm:min-h-[82vh]"
    >
      <motion.p
        class="eyebrow"
        :initial="reveal.hidden"
        :animate="reveal.shown"
        :transition="{ duration: 0.5, ease: EASE_OUT }"
      >
        {{ $t("main.eyebrow") }}
      </motion.p>

      <motion.h1
        class="mt-5 max-w-4xl text-5xl leading-[0.95] font-light tracking-tight text-balance sm:text-7xl lg:text-8xl"
        :initial="reveal.hidden"
        :animate="reveal.shown"
        :transition="{ delay: 0.08, duration: 0.6, ease: EASE_OUT }"
      >
        {{ $t("main.header") }}
      </motion.h1>

      <motion.p
        class="mt-7 max-w-xl text-lg text-balance text-black/60"
        :initial="reveal.hidden"
        :animate="reveal.shown"
        :transition="{ delay: 0.16, duration: 0.6, ease: EASE_OUT }"
      >
        {{ $t("main.subheader") }}
      </motion.p>

      <motion.ul
        class="mt-10 flex flex-wrap items-center gap-4"
        :initial="reveal.hidden"
        :animate="reveal.shown"
        :transition="{ delay: 0.24, duration: 0.6, ease: EASE_OUT }"
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
      </motion.ul>

      <!-- Coins sit on the hero's bottom edge and overlap the divider.
           Decorative: the headline already carries the meaning. -->
      <div
        aria-hidden="true"
        class="pointer-events-none mt-12 -mb-10 flex items-end justify-between gap-2 sm:-mb-14 lg:-mb-20"
      >
        <motion.img
          v-for="(coin, index) in COINS"
          :key="coin.src"
          :src="coin.src"
          alt=""
          class="w-[22%] max-w-[170px] object-contain"
          :initial="{ opacity: 0, y: 28 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{
            delay: 0.36 + index * 0.09,
            duration: 0.7,
            ease: EASE_OUT,
          }"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { motion } from "motion-v";

const localePath = useLocalePath();

const EASE_OUT = [0.23, 1, 0.32, 1];

const COINS = [
  { src: "/coin1.png" },
  { src: "/coin2.png" },
  { src: "/coin3.png" },
  { src: "/coin4.svg" },
];

// One shared enter definition; reduced motion drops the rise, keeps the fade.
const reducedMotion = useReducedMotion();

const reveal = computed(() => ({
  hidden: reducedMotion.value ? { opacity: 0 } : { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0 },
}));
</script>
