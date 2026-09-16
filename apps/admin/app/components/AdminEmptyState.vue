<template>
  <div class="flex flex-col items-center gap-3 px-4 py-12 text-center">
    <p class="text-sm font-medium text-neutral-700">{{ title }}</p>
    <p v-if="description" class="max-w-xs text-sm text-neutral-500">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-1">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
