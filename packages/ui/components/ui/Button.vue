<template>
  <component
    :is="component"
    :class="rootClass"
    v-bind="elementAttrs"
    :aria-busy="props.loading ? 'true' : undefined"
  >
    <span :class="ui.content()">
      <slot />
    </span>

    <!-- Trailing "coin": two arrows share one cell, so on hover the first
         slides out to the right while the second slides in from the left. -->
    <span v-if="props.arrow" aria-hidden="true" :class="ui.chip()">
      <svg
        :class="
          ui.arrow({
            class: 'motion-safe:group-hover/button:translate-x-[175%]',
          })
        "
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
      <svg
        :class="
          ui.arrow({
            class:
              '-translate-x-[175%] motion-safe:group-hover/button:translate-x-0',
          })
        "
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </span>

    <!-- Spinner stays mounted so loading cross-fades instead of popping in. -->
    <span aria-hidden="true" :class="ui.spinner()">
      <span
        class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:600ms]"
      />
    </span>
  </component>
</template>

<script lang="ts">
import { tv } from "tailwind-variants";

/*
  Pill-shaped, tactile buttons. The shape echoes the coins in the logo, and
  the optional arrow "coin" gives primary calls to action their character.
  Every variant carries a 1px border (transparent where unused) so heights
  match across variants and forced-colors mode still draws an edge.
*/
const button = tv({
  // The chip sits 3px in from the edge, so it fills the button's height
  // exactly and an arrow button lines up with a plain one of the same size.
  compoundVariants: [
    { arrow: true, class: { base: "py-0.75 pr-0.75" }, size: "sm" },
    { arrow: true, class: { base: "py-0.75 pr-0.75" }, size: "default" },
    { arrow: true, class: { base: "gap-3 py-0.75 pr-0.75" }, size: "lg" },
  ],
  slots: {
    arrow: "[grid-area:1/1] transition-[translate] duration-300 ease-out",
    base: "group/button relative inline-flex cursor-pointer items-center justify-center rounded-full border text-center font-medium tracking-[-0.006em] transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-out select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
    chip: "relative grid shrink-0 place-items-center overflow-hidden rounded-full transition-[background-color,color,opacity,filter] duration-150 ease-out",
    content:
      "inline-flex items-center gap-[inherit] transition-[opacity,filter] duration-300 ease-swap",
    spinner:
      "pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-[opacity,scale,filter] duration-300 ease-swap motion-safe:scale-25 motion-safe:blur-xs",
  },
  variants: {
    arrow: { false: {}, true: {} },
    loading: {
      false: {},
      true: {
        chip: "opacity-0 duration-300 ease-swap motion-safe:blur-xs",
        content: "opacity-0 motion-safe:blur-xs",
        spinner: "opacity-100 motion-safe:scale-100 motion-safe:blur-[0px]",
      },
    },
    pressable: {
      false: {},
      true: { base: "motion-safe:active:not-disabled:scale-[0.96]" },
    },
    size: {
      default: {
        arrow: "size-3.5",
        base: "min-h-9 gap-2 py-1.5 pr-4 pl-4 text-sm",
        chip: "size-7",
      },
      lg: {
        arrow: "size-4",
        base: "min-h-11 gap-2.5 py-2 pr-5 pl-5 text-[15px]",
        chip: "size-9",
      },
      sm: {
        arrow: "size-3",
        base: "min-h-8 gap-1.5 py-1 pr-3.5 pl-3.5 text-[13px]",
        chip: "size-6",
      },
    },
    variant: {
      brand: {
        base: "border-transparent bg-brand text-neutral-950 shadow-button-brand hover:bg-[#ffa31f]",
        chip: "bg-neutral-950 text-brand",
      },
      danger: {
        base: "border-red-600/30 bg-white text-red-700 shadow-button-light hover:border-red-600 hover:bg-red-600 hover:text-white",
        chip: "bg-red-600 text-white group-hover/button:bg-white group-hover/button:text-red-600",
      },
      inverse: {
        base: "border-transparent bg-white text-neutral-950 shadow-button-light hover:bg-neutral-100",
        chip: "bg-brand text-neutral-950",
      },
      outline: {
        base: "border-black/15 bg-white text-neutral-950 shadow-button-light hover:border-black/30 hover:bg-neutral-50",
        chip: "bg-neutral-950 text-white",
      },
      primary: {
        base: "border-transparent bg-neutral-950 bg-linear-to-b from-white/8 to-white/0 text-white shadow-button-dark hover:bg-neutral-800",
        chip: "bg-brand text-neutral-950",
      },
      subtle: {
        base: "border-transparent bg-black/5 text-neutral-950 hover:bg-black/8",
        chip: "bg-neutral-950 text-white",
      },
    },
  },
});
</script>

<script setup lang="ts">
import { normalizeClass } from "vue";
import type { AnchorHTMLAttributes, HTMLAttributes } from "vue";

interface ButtonProps {
  as?: string;
  variant?: "primary" | "inverse" | "outline" | "subtle" | "danger" | "brand";
  size?: "sm" | "default" | "lg";
  href?: AnchorHTMLAttributes["href"];
  to?: string;
  target?: AnchorHTMLAttributes["target"];
  disabled?: boolean;
  loading?: boolean;
  /** Trailing arrow chip for forward-moving calls to action. */
  arrow?: boolean;
  /** Disable the scale-on-press feedback where motion would distract. */
  static?: boolean;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<ButtonProps>(), {
  arrow: false,
  as: "button",
  disabled: false,
  loading: false,
  size: "default",
  static: false,
  variant: "primary",
});

const isLink = computed(() => Boolean(props.to || props.href));

const component = computed(() =>
  isLink.value ? resolveComponent("NuxtLink") : props.as
);

// Link-only props stay off <button>, and `disabled` stays off links.
const elementAttrs = computed(() =>
  isLink.value
    ? {
        external: props.target ? true : undefined,
        target: props.target,
        to: props.to ?? props.href,
      }
    : { disabled: props.disabled }
);

const ui = computed(() =>
  button({
    arrow: props.arrow,
    loading: props.loading,
    pressable: !props.static,
    size: props.size,
    variant: props.variant,
  })
);

// Vue takes objects and arrays for `class`, but tailwind-merge reads only
// strings, so the value is flattened before it merges with the variants.
const rootClass = computed(() =>
  ui.value.base({ class: normalizeClass(props.class) })
);
</script>
