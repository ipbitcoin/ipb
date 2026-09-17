<template>
  <section id="values" class="section section-gap">
    <p class="eyebrow">{{ $t("values.eyebrow") }}</p>
    <h2 class="section-title mt-4">{{ $t("values.title") }}</h2>

    <IPBSkeleton v-if="pending" variant="row" :count="3" class="mt-14" />

    <ul v-else class="mt-14 flex flex-col">
      <li
        v-for="(value, index) in values ?? []"
        :key="value.title"
        class="reveal grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-black/10 py-10 md:grid-cols-[6rem_1fr_1.2fr] md:gap-x-10 md:py-12"
        :style="{ '--reveal-delay': `${(index % 3) * 60}ms` }"
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
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
interface ValueItem {
  title: string;
  description: string;
}

defineProps<{
  values: ValueItem[] | null | undefined;
  pending?: boolean;
}>();
</script>
