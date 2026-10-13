<template>
  <span
    aria-hidden="true"
    class="size-2 shrink-0 rounded-full"
    :class="SWATCH_CLASSES[color]"
  />
</template>

<script setup lang="ts">
import type { LabelColor } from "~/utils/palette";
import { SWATCH_CLASSES } from "~/utils/palette";

defineProps<{ color: LabelColor }>();
</script>
