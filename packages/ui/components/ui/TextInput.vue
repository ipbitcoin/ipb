<template>
  <input v-model="model" :class="[textInputClass, props.class]" />
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import type { HTMLAttributes } from "vue";

interface TextInputProps {
  variant?: "line" | "inverse";
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<TextInputProps>(), {
  variant: "line",
});

const textInputClass = computed(() =>
  tv({
    base: "placeholder:text-black/45 outline-none transition-[border-color,box-shadow] duration-150 ease-out",
    variants: {
      variant: {
        inverse:
          "rounded-[3px] bg-white px-2 py-0.5 text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        line: "border-b border-black/25 px-1 text-black focus:border-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
      },
    },
  })({ variant: props.variant })
);

const model = defineModel({ type: String });
</script>
