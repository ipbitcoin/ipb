<template>
  <label
    class="flex h-8 w-56 shrink items-center gap-2 rounded-full bg-white px-3 shadow-border transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_oklab,var(--color-brand)_15%,transparent)] max-sm:w-full"
  >
    <IconSearch class="size-4 shrink-0 text-neutral-400" />
    <input
      v-model="query"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      class="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
      @keydown.esc="query = ''"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ placeholder?: string }>(), {
  placeholder: "Procurar…",
});

const query = defineModel<string>({ required: true });
</script>
