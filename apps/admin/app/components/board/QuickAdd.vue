<template>
  <form v-if="adding" @submit.prevent="submit">
    <input
      ref="field"
      v-model="title"
      type="text"
      autocomplete="off"
      :aria-label="placeholder"
      :placeholder="placeholder"
      class="h-9 w-full rounded-lg bg-white px-3 text-sm text-neutral-900 shadow-border outline-none placeholder:text-neutral-400 focus:shadow-[0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_oklab,var(--color-brand)_15%,transparent)]"
      @blur="onBlur"
      @keydown.esc.prevent="close"
    />
  </form>
  <button
    v-else
    type="button"
    class="flex h-8 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm text-neutral-500 outline-none transition-colors duration-150 hover:bg-neutral-950/5 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-brand"
    @click="open"
  >
    <IconPlus class="size-4" />
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  placeholder: string;
}>();

const emit = defineEmits<{ add: [title: string] }>();

const adding = ref(false);
const title = ref("");
const field = useTemplateRef<HTMLInputElement>("field");

async function open() {
  adding.value = true;
  await nextTick();
  field.value?.focus();
}

function close() {
  title.value = "";
  adding.value = false;
}

/** Stays open for the next one, so a run of cards goes in quickly. */
function submit() {
  const value = title.value.trim();
  if (value) {
    emit("add", value);
    title.value = "";
  }
}

function onBlur() {
  if (!title.value.trim()) {
    close();
  }
}
</script>
