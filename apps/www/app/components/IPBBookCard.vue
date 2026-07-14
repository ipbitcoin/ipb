<template>
  <div class="flex flex-col gap-2 group">
    <div
      class="relative overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300"
      style="aspect-ratio: 2/3"
    >
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        v-else
        class="w-full h-full bg-black/10 flex items-center justify-center"
      >
        <span class="text-black/30 text-xs text-center px-3">{{ title }}</span>
      </div>

      <div
        v-if="description"
        class="absolute inset-0 bg-black/85 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <p
          class="text-white text-xs leading-relaxed line-clamp-[10] text-center"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <h3 class="text-sm font-semibold leading-snug line-clamp-2">
        {{ title }}
      </h3>
      <p class="text-xs text-black/60">{{ author }}</p>
      <p class="text-xs text-black/40">
        <span v-if="publisher">{{ publisher }}</span>
        <template v-if="publisher && year"> · </template>
        <span v-if="year">{{ year }}</span>
        <template v-if="(publisher || year) && pages"> · </template>
        <span v-if="pages"
          >{{ pages }} {{ locale === "pt" ? "págs." : "pp." }}</span
        >
      </p>

      <a
        v-if="url"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 block text-center text-xs font-semibold uppercase tracking-wide border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors duration-200"
      >
        {{ locale === "pt" ? "Comprar" : "Buy" }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n();

interface BookCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  publisher?: string;
  year?: number;
  pages?: number;
  description?: string;
  url?: string;
}

defineProps<BookCardProps>();
</script>
