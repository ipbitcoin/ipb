<template>
  <div class="flex items-center gap-1 text-white">
    <button
      v-for="option in OPTIONS"
      :key="option.code"
      type="button"
      class="cursor-pointer rounded px-0.5 transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      :class="
        locale === option.code
          ? 'font-bold'
          : 'font-normal opacity-70 hover:opacity-100'
      "
      :aria-current="locale === option.code ? 'true' : undefined"
      :aria-label="option.label"
      @click="setLocale(option.code)"
    >
      {{ option.short }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { setLocale, locale } = useI18n();

// `|` separator dropped: the active weight already carries the state.
const OPTIONS = [
  { code: "pt", label: "Português", short: "PT" },
  { code: "en", label: "English", short: "EN" },
] as const;
</script>
