<template>
  <NuxtLink
    :to="localePath({ name: 'artigo-slug', params: { slug } })"
    class="group focus-ring relative max-w-[400px] overflow-hidden border border-black/15 transition-colors duration-150 ease-out hover:border-black/40"
  >
    <div class="h-60 w-full overflow-hidden">
      <img
        :src="image"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover outline -outline-offset-1 outline-black/10 transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>
    <div class="flex flex-col p-4">
      <span v-if="category" class="text-sm uppercase">{{ category }}</span>
      <NuxtTime
        v-if="createdAt"
        class="text-sm text-neutral-500 uppercase tabular-nums"
        :datetime="createdAt"
        :locale="locale"
        day="2-digit"
        month="2-digit"
        year="numeric"
      />
      <div class="flex items-baseline justify-between gap-4">
        <h3 class="text-xl">{{ title }}</h3>
        <svg
          class="-mr-1 ml-1.5 min-h-[14px] min-w-[14px] stroke-[1.5px]"
          fill="none"
          stroke="currentColor"
          width="14"
          height="14"
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
const localePath = useLocalePath();
const { locale } = useI18n();

interface ArticleCardProps {
  title: string;
  slug: string;
  category?: string;
  image: string;
  createdAt?: string;
}

defineProps<ArticleCardProps>();
</script>
