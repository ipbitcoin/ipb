<template>
  <div v-if="layout === 'list'" aria-busy="true" class="flex flex-col gap-3">
    <div class="h-32 animate-pulse rounded-2xl bg-neutral-950/3.5" />
    <div class="h-48 animate-pulse rounded-2xl bg-neutral-950/3.5" />
  </div>
  <div v-else aria-busy="true" class="grid min-h-64 grow gap-3 sm:grid-cols-3">
    <div class="animate-pulse rounded-2xl bg-neutral-950/3.5" />
    <div class="animate-pulse rounded-2xl bg-neutral-950/3.5 max-sm:hidden" />
    <div class="animate-pulse rounded-2xl bg-neutral-950/3.5 max-sm:hidden" />
  </div>
</template>

<script setup lang="ts">
import type { BoardLayout } from "~/utils/boards";

defineProps<{ layout: BoardLayout }>();
</script>
