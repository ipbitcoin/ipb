<template>
  <section :id="sectionId" class="section section-gap">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div class="flex flex-col gap-4">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h2 :class="headingLevel === 'h1' ? 'sr-only' : 'section-title'">
          {{ title }}
        </h2>
      </div>
      <NuxtLink
        v-if="to"
        :to="to"
        class="focus-ring group rounded text-sm font-medium tracking-wider uppercase"
      >
        {{ $t("common.seeAll") }}
        <span
          class="inline-block transition-transform duration-150 ease-out group-hover:translate-x-1"
          aria-hidden="true"
          >&rarr;</span
        >
      </NuxtLink>
    </div>

    <p
      v-if="description"
      class="mt-5 max-w-3xl text-lg text-balance text-black/60"
    >
      {{ description }}
    </p>

    <IPBSkeleton
      v-if="pending"
      variant="card"
      :count="initialCount"
      class="mt-12"
    />

    <template v-else-if="articles?.length">
      <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <IPBArticleCard
          v-for="article in visibleArticles"
          :key="article.documentId"
          :title="article.title"
          :slug="article.slug"
          :category="
            showCategory ? (article.category?.name ?? undefined) : undefined
          "
          :image="article.main_image.url"
          :created-at="showDate ? article.createdAt : undefined"
        />
      </div>

      <div
        v-if="hasMore || canShowLess"
        class="mt-10 flex justify-center gap-4"
      >
        <button
          v-if="hasMore"
          type="button"
          class="focus-ring cursor-pointer border border-black px-6 py-2.5 text-sm font-medium tracking-wide uppercase transition-[background-color,color,scale] duration-150 ease-out hover:bg-black hover:text-white active:scale-[0.96]"
          @click="showMore"
        >
          {{ $t("common.showMore") }}
        </button>
        <button
          v-if="canShowLess"
          type="button"
          class="focus-ring cursor-pointer border border-black/30 px-6 py-2.5 text-sm font-medium tracking-wide uppercase transition-[border-color,scale] duration-150 ease-out hover:border-black active:scale-[0.96]"
          @click="showLess"
        >
          {{ $t("common.showLess") }}
        </button>
      </div>
    </template>

    <p v-else-if="emptyLabel" class="mt-10 text-black/50">{{ emptyLabel }}</p>
  </section>
</template>

<script setup lang="ts">
interface ArticleItem {
  documentId: string;
  title: string;
  slug: string;
  createdAt?: string;
  main_image: { url: string };
  category?: { name: string } | null;
}

const props = withDefaults(
  defineProps<{
    title: string;
    articles: ArticleItem[] | null | undefined;
    eyebrow?: string;
    description?: string;
    pending?: boolean;
    /** How many cards before "show more" appears. */
    initialCount?: number;
    /** Optional "see all" destination. */
    to?: string;
    sectionId?: string;
    emptyLabel?: string;
    showCategory?: boolean;
    showDate?: boolean;
    headingLevel?: "h1" | "h2";
  }>(),
  {
    headingLevel: "h2",
    initialCount: 6,
    showCategory: false,
    showDate: true,
  }
);

// Same progressive-reveal pattern already used for books on the education page.
const visibleCount = ref(props.initialCount);

watch(
  () => props.articles,
  () => {
    visibleCount.value = props.initialCount;
  }
);

const visibleArticles = computed(() =>
  (props.articles ?? []).slice(0, visibleCount.value)
);
const hasMore = computed(
  () => visibleCount.value < (props.articles?.length ?? 0)
);
const canShowLess = computed(() => visibleCount.value > props.initialCount);

function showMore() {
  visibleCount.value += props.initialCount;
}

function showLess() {
  visibleCount.value = props.initialCount;
}
</script>
