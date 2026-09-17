<template>
  <main class="px-8">
    <div class="section flex flex-col gap-4 pt-20 pb-16 sm:pt-28">
      <h1
        class="max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
      >
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
