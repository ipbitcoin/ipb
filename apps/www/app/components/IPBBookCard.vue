<template>
  <div class="group flex flex-col gap-2">
    <div
      class="relative overflow-hidden shadow-md transition-shadow duration-300 ease-out group-hover:shadow-xl"
      style="aspect-ratio: 2/3"
    >
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover outline -outline-offset-1 outline-black/10 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-black/10"
      >
        <span class="px-3 text-center text-xs text-black/30">{{ title }}</span>
      </div>

      <!-- Hover blurb: decorative, so it stays out of the a11y tree -->
      <div
        v-if="description"
        aria-hidden="true"
        class="absolute inset-0 flex items-center justify-center bg-black/85 p-4 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
      >
        <p
          class="line-clamp-[10] text-center text-xs leading-relaxed text-white"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <h3 class="line-clamp-2 text-sm leading-snug font-semibold">
        {{ title }}
      </h3>
      <p class="text-xs text-black/60">{{ author }}</p>
      <p class="text-xs text-black/40">
        <span v-if="publisher">{{ publisher }}</span>
        <template v-if="publisher && year"> · </template>
        <span v-if="year" class="tabular-nums">{{ year }}</span>
        <template v-if="(publisher || year) && pages"> · </template>
        <span v-if="pages" class="tabular-nums"
          >{{ pages }} {{ locale === "pt" ? "págs." : "pp." }}</span
        >
      </p>

      <a
        v-if="url"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="focus-ring mt-2 block border border-black px-3 py-2 text-center text-xs font-semibold tracking-wide uppercase transition-[background-color,color,scale] duration-150 ease-out hover:bg-black hover:text-white active:scale-[0.96]"
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
