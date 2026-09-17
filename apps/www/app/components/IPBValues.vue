<template>
  <section id="values" class="section section-gap">
    <p class="eyebrow">{{ $t("values.eyebrow") }}</p>
    <h2 class="section-title mt-4">{{ $t("values.title") }}</h2>

    <IPBSkeleton v-if="pending" variant="row" :count="3" class="mt-14" />

    <ul v-else class="mt-14 flex flex-col">
      <motion.li
        v-for="(value, index) in values ?? []"
        :key="value.title"
        class="group grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-black/10 py-10 md:grid-cols-[6rem_1fr_1.2fr] md:gap-x-10 md:py-12"
        :initial="reveal.hidden"
        :while-in-view="reveal.shown"
        :in-view-options="{ margin: '-80px', once: true }"
        :transition="{
          delay: (index % 3) * 0.06,
          duration: 0.6,
          ease: EASE_OUT,
        }"
      >
        <span
          class="text-brand pt-1 font-light tabular-nums md:text-lg"
          aria-hidden="true"
        >
          {{ String(index + 1).padStart(2, "0") }}
        </span>
        <h3 class="text-2xl leading-tight font-light text-balance md:text-3xl">
          {{ value.title }}
        </h3>
        <p
          class="col-start-2 max-w-2xl text-black/60 md:col-start-3 md:text-lg"
        >
          {{ value.description }}
        </p>
      </motion.li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { motion } from "motion-v";

interface ValueItem {
  title: string;
  description: string;
}

defineProps<{
  values: ValueItem[] | null | undefined;
  pending?: boolean;
}>();

const EASE_OUT = [0.23, 1, 0.32, 1];

const reducedMotion = useReducedMotion();

const reveal = computed(() => ({
  hidden: reducedMotion.value ? { opacity: 0 } : { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0 },
}));
</script>
