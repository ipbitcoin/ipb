<template>
  <NuxtLink
    :to="link"
    target="_blank"
    external
    class="focus-ring block max-w-[350px] rounded transition-opacity duration-150 ease-out hover:opacity-80"
  >
    <img :src="logo" :alt="name" loading="lazy" />
  </NuxtLink>
</template>

<script setup lang="ts">
interface PartnerProps {
  name: string;
  logo: string;
  link?: string;
}

defineProps<PartnerProps>();
</script>
