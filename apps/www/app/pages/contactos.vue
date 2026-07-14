<template>
  <main class="px-8">
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4">
      <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
        {{ $t("nav.contacts") }}
      </h1>
      <p>
        Email:
        <a href="mailto:info@institutobitcoin.pt" class="font-medium underline">
          info@institutobitcoin.pt
        </a>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
const { locale } = useI18n();

useSeoMeta({
  description:
    locale.value === "pt"
      ? "Entre em contacto com o Instituto Português de Bitcoin. Email: info@institutobitcoin.pt"
      : "Get in touch with the Portuguese Bitcoin Institute. Email: info@institutobitcoin.pt",
  ogDescription:
    locale.value === "pt"
      ? "Entre em contacto com o Instituto Português de Bitcoin."
      : "Get in touch with the Portuguese Bitcoin Institute.",
  ogTitle: locale.value === "pt" ? "Contactos | IPB" : "Contacts | IPB",
  title: locale.value === "pt" ? "Contactos" : "Contacts",
});
</script>
