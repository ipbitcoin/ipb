<template>
  <input v-model="model" :class="textInputClass" />
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
    base: "font-body placeholder:text-black/45 focus:outline-none",
    variants: {
      variant: {
        inverse: "bg-white text-black rounded-[3px] px-2 py-0.5",
        line: "text-black border-b px-1",
      },
    },
  })(props)
);

const model = defineModel({ type: String });
</script>
