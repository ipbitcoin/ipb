<template>
  <component
    :is="component"
    :class="[buttonClass, props.class]"
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
  variant?: "primary" | "inverse" | "outline" | "subtle" | "danger";
  size?: "default" | "lg";
  href?: AnchorHTMLAttributes["href"];
  to?: string;
  target?: AnchorHTMLAttributes["target"];
  disabled?: boolean;
  loading?: boolean;
  /** Disable the scale-on-press feedback where motion would distract. */
  static?: boolean;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: "button",
  disabled: false,
  loading: false,
  size: "default",
  static: false,
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
    base: "relative inline-flex cursor-pointer items-center justify-center rounded-[3px] text-sm font-semibold uppercase transition-[background-color,color,border-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      pressable: {
        false: "",
        true: "active:not-disabled:scale-[0.96]",
      },
      size: {
        default: "px-4 py-1.5",
        lg: "px-6 py-2",
      },
      variant: {
        danger:
          "border border-red-600 bg-white text-red-600 hover:bg-red-600 hover:text-white",
        inverse: "bg-white text-black hover:bg-neutral-100",
        outline: "border border-black bg-white hover:bg-black hover:text-white",
        primary: "bg-black text-white hover:bg-neutral-800",
        subtle: "border border-[#C2C2C2] bg-white hover:bg-[#f8f8f8]",
      },
    },
  })({ pressable: !props.static, size: props.size, variant: props.variant })
);

const loadingClass = computed(() =>
  tv({
    base: "size-4 animate-spin mt-0!",
    variants: {
      variant: {
        danger: "text-red-600",
        inverse: "text-black",
        outline: "text-black",
        primary: "text-white",
        subtle: "text-black",
      },
    },
  })({ variant: props.variant })
);
</script>
