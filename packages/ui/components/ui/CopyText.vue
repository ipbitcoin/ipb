<template>
  <div
    class="inline-flex items-center gap-4 border-b px-1 font-body justify-between"
  >
    <span>{{ truncated }}</span>
    <button @click="copyText" class="cursor-pointer">
      <IconClipboard v-if="!wasCopied" class="size-5" />
      <IconCheck v-else class="size-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
interface CopyTextProps {
  text: string;
}

const props = defineProps<CopyTextProps>();

const wasCopied = ref(false);

const truncated = computed(
  () => `${props.text.slice(0, 10)}...${props.text.slice(-10)}`
);

function copyText() {
  navigator.clipboard.writeText(String(props.text));
  wasCopied.value = true;
  setTimeout(() => {
    wasCopied.value = false;
  }, 2000);
}
</script>
