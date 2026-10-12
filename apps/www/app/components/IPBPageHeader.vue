<template>
  <!-- Opening block of every inner page and home of its one h1. It stages in
       like the hero: title, then description, then actions, 100ms apart. -->
  <header class="section pt-14 sm:pt-20">
    <div v-if="$slots.before" class="enter mb-10">
      <slot name="before" />
    </div>

    <div class="flex max-w-4xl flex-col gap-5">
      <p v-if="eyebrow" class="enter eyebrow">{{ eyebrow }}</p>
      <h1 class="enter page-title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p
        v-if="description"
        class="enter lead max-w-2xl"
        style="--enter-delay: 100ms"
      >
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.default" class="enter mt-10" style="--enter-delay: 200ms">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  eyebrow?: string;
  description?: string;
}>();
</script>
