<template>
  <NuxtLink
    :to="localePath({ name: 'artigo-slug', params: { slug } })"
    class="relative group border overflow-hidden max-w-[400px]"
  >
    <div class="overflow-hidden w-full h-60">
      <img
        :src="image"
        :alt="title"
        class="w-full transition-transform duration-500 group-hover:scale-105 object-cover h-full"
      />
    </div>
    <div class="flex flex-col p-4">
      <span v-if="category" class="uppercase text-sm">{{ category }}</span>
      <NuxtTime
        v-if="createdAt"
        class="uppercase text-sm text-neutral-500"
        :datetime="createdAt"
        :locale="locale"
        day="2-digit"
        month="2-digit"
        year="numeric"
      />
      <div class="flex justify-between gap-4 items-baseline">
        <h3 class="text-xl">{{ title }}</h3>
        <svg
          class="stroke-[1.5px] -mr-1 ml-1.5 min-h-[14px] min-w-[14px]"
          fill="none"
          stroke="currentColor"
          width="14"
          height="14"
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
