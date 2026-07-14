<template>
  <component
    :is="component"
    :class="buttonClass"
    :href="props.href"
    :to="props.to"
    :target="props.target"
    :external="!!props.target"
    :disabled="props.disabled"
  >
    <span class="flex items-center" :class="{ invisible: props.loading }">
      <slot />
    </span>
    <span
      v-show="props.loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <svg
        :class="loadingClass"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
  </component>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import type { AnchorHTMLAttributes, HTMLAttributes } from "vue";

interface ButtonProps {
  as?: string;
  variant?: "primary" | "inverse" | "outline" | "subtle";
  size?: "default" | "lg";
  href?: AnchorHTMLAttributes["href"];
  to?: string;
  target?: AnchorHTMLAttributes["target"];
  disabled?: boolean;
  loading?: boolean;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: "button",
  disabled: false,
  loading: false,
  size: "default",
  variant: "primary",
});

const component = computed(() => {
  if (props.to || props.href) {
    return resolveComponent("NuxtLink");
  }
  return "button";
});

const buttonClass = computed(() =>
  tv({
    base: "relative inline-flex items-center py-1.5 justify-center cursor-pointer rounded-[3px] font-semibold uppercase text-sm bg-black duration-200",
    variants: {
      size: {
        default: "px-4 py-1",
        lg: "px-6 py-2",
      },
      variant: {
        inverse: "bg-white text-black",
        outline:
          "border border-black bg-white transition-colors hover:bg-black hover:text-white",
        primary: "bg-black text-white",
        subtle:
          "border border-[#C2C2C2] bg-white transition-colors hover:bg-[#f8f8f8]",
      },
    },
  })(props)
);

const loadingClass = computed(() =>
  tv({
    base: "size-4 animate-spin mt-0!",
    variants: {
      variant: {
        inverse: "text-black",
        outline: "text-black",
        primary: "text-white",
        subtle: "text-black",
      },
    },
  })(props)
);
</script>
