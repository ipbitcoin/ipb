<template>
  <div class="flex items-center gap-1 text-white">
    <button
      class="cursor-pointer"
      :class="[locale === 'pt' ? 'font-bold' : 'font-normal hover:underline']"
      @click="setLocale('pt')"
    >
      PT
    </button>
    <span>|</span>
    <button
      class="cursor-pointer"
      :class="[locale === 'en' ? 'font-bold' : 'font-normal hover:underline']"
      @click="setLocale('en')"
    >
      EN
    </button>
  </div>
</template>

<script setup lang="ts">
const { setLocale, locale } = useI18n();
</script>
