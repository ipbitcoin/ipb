<template>
  <div
    class="inline-flex items-center justify-between gap-4 border-b border-black/25 px-1"
  >
    <span>{{ truncated }}</span>
    <!-- Both icons stay mounted so the swap cross-fades in both directions -->
    <button
      class="relative size-5 shrink-0 cursor-pointer rounded transition-colors duration-100 hover:text-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      type="button"
      :aria-label="wasCopied ? copiedLabel : copyLabel"
      @click="copyText"
    >
      <IconCheck
        class="absolute inset-0 size-5 transition-[opacity,filter,scale] duration-300 ease-swap"
        :class="wasCopied ? swapIn : swapOut"
      />
      <IconClipboard
        class="size-5 transition-[opacity,filter,scale] duration-300 ease-swap"
        :class="wasCopied ? swapOut : swapIn"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
interface CopyTextProps {
  text: string;
  copyLabel?: string;
  copiedLabel?: string;
}

const props = withDefaults(defineProps<CopyTextProps>(), {
  copiedLabel: "Copiado",
  copyLabel: "Copiar",
});

// Scale and blur only run when the user allows motion; opacity always fades.
const swapIn = "opacity-100 motion-safe:scale-100 motion-safe:blur-[0px]";
const swapOut = "opacity-0 motion-safe:scale-25 motion-safe:blur-xs";

const wasCopied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const truncated = computed(
  () => `${props.text.slice(0, 10)}...${props.text.slice(-10)}`
);

function copyText() {
  navigator.clipboard.writeText(String(props.text));
  wasCopied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    wasCopied.value = false;
  }, 2000);
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>
