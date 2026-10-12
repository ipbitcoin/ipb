<template>
  <!-- Placeholder geometry mirrors the real component, so nothing jumps on swap -->
  <div
    v-if="variant === 'card'"
    aria-hidden="true"
    class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
  >
    <div v-for="n in count" :key="n" class="flex flex-col gap-5">
      <div :class="['aspect-16/10 rounded-2xl', block]" />
      <div class="flex flex-col gap-2.5">
        <div :class="['h-4 w-24 rounded', block]" />
        <div :class="['h-6 w-11/12 rounded', block]" />
        <div :class="['h-6 w-2/3 rounded', block]" />
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'tile'"
    aria-hidden="true"
    :class="[
      'grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3',
      tone === 'dark' ? 'bg-white/10' : 'bg-black/10',
    ]"
  >
    <div
      v-for="n in count"
      :key="n"
      :class="[
        'flex min-h-64 flex-col justify-between gap-10 p-8 sm:p-10',
        tone === 'dark' ? 'bg-neutral-950' : 'bg-white',
      ]"
    >
      <div :class="['h-4 w-6 rounded', block]" />
      <div class="flex flex-col gap-3">
        <div :class="['h-7 w-40 rounded', block]" />
        <div :class="['h-4 w-full rounded', block]" />
        <div :class="['h-4 w-3/4 rounded', block]" />
      </div>
    </div>
  </div>

  <div
    v-else-if="variant === 'list'"
    aria-hidden="true"
    class="flex flex-col border-t border-black/10"
  >
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center justify-between gap-6 border-b border-black/10 py-6"
    >
      <div
        :class="['h-6 rounded', block]"
        :style="{ width: `${75 - (n % 3) * 15}%` }"
      />
      <div :class="['size-8 shrink-0 rounded-full', block]" />
    </div>
  </div>

  <div v-else aria-hidden="true" class="flex flex-col gap-3">
    <div
      v-for="n in count"
      :key="n"
      :class="['h-4 rounded', block]"
      :style="{ width: `${90 - n * 8}%` }"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "card" | "tile" | "list" | "text";
    count?: number;
    tone?: "light" | "dark";
  }>(),
  { count: 3, tone: "light", variant: "card" }
);

// A slow pulse reads as "loading"; a fast one reads as an alarm.
const block = computed(() => [
  "animate-pulse [animation-duration:1.6s] motion-reduce:animate-none",
  props.tone === "dark" ? "bg-white/8" : "bg-black/5",
]);
</script>
