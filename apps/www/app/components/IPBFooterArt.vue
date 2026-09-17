<template>
  <!--
    Commission-ready art slot.

    Sized and positioned for a future illustration that bleeds off the bottom
    of the footer (see the reference: a wide, low-detail line drawing sitting
    behind the wordmark). Renders nothing until `src` is supplied, so the
    footer layout is already correct for the day the artwork lands.

    To use: drop the asset in apps/www/public/ and pass
    `<IPBFooterArt src="/footer-art.svg" />` from the footer. Art should be
    wide (roughly 3:1), single-colour, and readable at low opacity on black.
  -->
  <div
    v-if="src"
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 bottom-0 h-48 overflow-hidden sm:h-64"
  >
    <img
      :src="src"
      alt=""
      loading="lazy"
      class="h-full w-full object-cover object-top opacity-[0.12]"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{ src?: string }>();
</script>
