<template>
  <NuxtLink :to="link" target="_blank" external class="max-w-[350px]">
    <img :src="logo" :alt="name" />
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
