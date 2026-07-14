<template>
  <div class="font-brand">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster position="top-right" invert />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  ogImage: "https://institutobitcoin.pt/og-image.png",
  ogImageAlt: "Instituto Português de Bitcoin",
  ogImageHeight: 630,
  ogImageWidth: 1200,
  twitterCard: "summary_large_image",
  twitterImage: "https://institutobitcoin.pt/og-image.png",
});
</script>
