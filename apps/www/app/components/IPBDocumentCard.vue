<template>
  <NuxtLink
    :to="url"
    target="_blank"
    external
    class="group focus-ring flex items-center gap-4 border border-black/15 p-8 transition-colors duration-150 ease-out hover:border-black/40"
  >
    <img src="/pdf.png" alt="" loading="lazy" class="shrink-0" />
    <div class="flex flex-col gap-1.5">
      <span class="text-lg font-medium">{{ title }}</span>
      <div class="flex items-center">
        <span class="text-sm">{{ $t("documents.cta") }}</span>
        <svg
          class="-mr-1 mb-0.5 ml-2.5 min-h-[14px] min-w-[12px] stroke-[1px]"
          fill="none"
          stroke="currentColor"
          width="12"
          height="12"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            class="opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
            d="M0 5h7"
          ></path>
          <path
            class="transition-transform duration-150 ease-out group-hover:translate-x-[3px]"
            d="M1 1l4 4-4 4"
          ></path>
        </svg>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface DocumentCardProps {
  title: string;
  url: string;
}

defineProps<DocumentCardProps>();
</script>
