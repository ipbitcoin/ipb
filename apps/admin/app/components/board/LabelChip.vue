<template>
  <span
    class="inline-flex h-5 max-w-36 min-w-0 items-center gap-1.5 rounded-full px-1.5 text-xs text-neutral-700 shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)]"
    :title="label.name"
  >
    <BoardLabelDot :color="label.color" />
    <span class="truncate">{{ label.name }}</span>
  </span>
</template>

<script setup lang="ts">
import type { IdeaLabel } from "~/utils/boards";

defineProps<{ label: IdeaLabel }>();
</script>
