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
        class="absolute inset-0 size-5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        :class="
          wasCopied
            ? 'scale-100 opacity-100 blur-0'
            : 'scale-[0.25] opacity-0 blur-[4px]'
        "
      />
      <IconClipboard
        class="size-5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        :class="
          wasCopied
            ? 'scale-[0.25] opacity-0 blur-[4px]'
            : 'scale-100 opacity-100 blur-0'
        "
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
