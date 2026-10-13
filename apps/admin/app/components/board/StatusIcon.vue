<template>
  <svg
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    class="size-4 shrink-0"
    :class="icon.tone"
  >
    <circle
      v-if="icon.shape === 'dashed'"
      cx="12"
      cy="12"
      r="9.75"
      stroke-width="2.5"
      stroke-dasharray="2.3 2.8"
      stroke-dashoffset="1.15"
      transform="rotate(-90 12 12)"
    />
    <template v-else-if="icon.shape === 'ring'">
      <circle cx="12" cy="12" r="9.75" stroke-width="2.5" />
      <path v-if="pie" :d="pie" fill="currentColor" stroke="none" />
    </template>
    <!-- A filled disc with a check cut out of it. -->
    <path
      v-else
      fill="currentColor"
      fill-rule="evenodd"
      clip-rule="evenodd"
      stroke="none"
      d="M12 1a11 11 0 1 0 0 22a11 11 0 1 0 0-22ZM8.38 11.37L10.5 13.48L15.62 8.37A1.25 1.25 0 0 1 17.38 10.13L11.38 16.13A1.25 1.25 0 0 1 9.62 16.13L6.62 13.13A1.25 1.25 0 0 1 8.38 11.37Z"
    />
  </svg>
</template>

<script setup lang="ts">
import type { StatusIcon } from "~/utils/boards";

const props = defineProps<{
  icon: StatusIcon;
  /** Read out in place of the icon; without it, the icon is decoration. */
  label?: string;
}>();

const RADIUS = 6.5;

/** A pie inside the ring, filled clockwise from the top as far as the work has come. */
const pie = computed(() => {
  const fill = Math.min(1, Math.max(0, props.icon.fill ?? 0));
  if (fill === 0) {
    return "";
  }
  if (fill === 1) {
    return `M12 ${12 - RADIUS}a${RADIUS} ${RADIUS} 0 1 1 0 ${2 * RADIUS}a${RADIUS} ${RADIUS} 0 1 1 0 ${-2 * RADIUS}Z`;
  }
  const angle = fill * 2 * Math.PI;
  const x = 12 + RADIUS * Math.sin(angle);
  const y = 12 - RADIUS * Math.cos(angle);
  const large = fill > 0.5 ? 1 : 0;
  return `M12 12V${12 - RADIUS}A${RADIUS} ${RADIUS} 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
});
</script>
