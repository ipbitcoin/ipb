<template>
  <NuxtLink
    :to="url"
    target="_blank"
    external
    class="group border p-8 flex gap-4 items-center"
  >
    <img src="/pdf.png" alt="PDF" />
    <div class="flex flex-col gap-1.5">
      <span class="text-lg font-medium">{{ title }}</span>
      <div class="flex items-center">
        <span class="text-sm">{{ $t("documents.cta") }}</span>
        <svg
          class="stroke-[1px] -mr-1 mb-0.5 min-h-[14px] min-w-[12px] ml-2.5"
          fill="none"
          stroke="currentColor"
          width="12"
          height="12"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            class="opacity-0 transition group-hover:opacity-100"
            d="M0 5h7"
          ></path>
          <path
            class="transition group-hover:translate-x-[3px]"
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
