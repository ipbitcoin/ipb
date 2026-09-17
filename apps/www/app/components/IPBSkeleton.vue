<template>
  <!-- Placeholder geometry mirrors the real component, so nothing jumps on swap -->
  <div
    v-if="variant === 'card'"
    class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
  >
    <div
      v-for="n in count"
      :key="n"
      class="max-w-[400px] border border-black/10"
    >
      <div class="h-60 w-full animate-pulse bg-black/5" />
      <div class="flex flex-col gap-2 p-4">
        <div class="h-3 w-20 animate-pulse rounded bg-black/5" />
        <div class="h-5 w-3/4 animate-pulse rounded bg-black/5" />
      </div>
    </div>
  </div>

  <div v-else-if="variant === 'row'" class="flex flex-col">
    <div
      v-for="n in count"
      :key="n"
      class="flex flex-col gap-3 border-t border-black/10 py-10 md:flex-row md:gap-10"
    >
      <div class="h-6 w-10 shrink-0 animate-pulse rounded bg-black/5" />
      <div class="flex w-full flex-col gap-3">
        <div class="h-7 w-48 animate-pulse rounded bg-black/5" />
        <div class="h-4 w-full max-w-xl animate-pulse rounded bg-black/5" />
      </div>
    </div>
  </div>

  <div v-else class="flex flex-col gap-3">
    <div
      v-for="n in count"
      :key="n"
      class="h-4 animate-pulse rounded bg-black/5"
      :style="{ width: `${90 - n * 8}%` }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "card" | "row" | "text";
    count?: number;
  }>(),
  { count: 3, variant: "card" }
);
</script>
