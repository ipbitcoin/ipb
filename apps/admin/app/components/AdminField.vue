<template>
  <div class="flex flex-col gap-1.5">
    <component
      :is="htmlFor ? 'label' : 'span'"
      :for="htmlFor"
      class="field-label"
    >
      {{ label
      }}<span v-if="required" class="ml-0.5 text-brand" aria-hidden="true"
        >*</span
      >
      <span v-if="hint" class="ml-2 text-xs font-normal text-neutral-500">
        {{ hint }}
      </span>
    </component>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  required?: boolean;
  hint?: string;
  /** Rendered as a `<label for>` when the control has an id. */
  htmlFor?: string;
}>();
</script>
