<template>
  <!-- Mono label like the eyebrows, with a hit area taller than the text. -->
  <NuxtLink
    :to="to"
    class="group/back -mx-1.5 -my-2 inline-flex items-center gap-2 rounded-sm px-1.5 py-2 font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-neutral-500 uppercase transition-[color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
  >
    <IconArrow
      class="size-3 rotate-180 transition-[translate] duration-150 ease-out motion-safe:group-hover/back:-translate-x-0.5"
    />
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string }>();
</script>
