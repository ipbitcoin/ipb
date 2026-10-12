<template>
  <section
    :id="sectionId"
    :aria-labelledby="hideHeader ? undefined : headingId"
    :aria-label="hideHeader ? title : undefined"
    :class="[
      'section',
      // Under a page header the h1 already opened the page: start close.
      hideHeader ? 'pt-12 pb-20 sm:pt-16 sm:pb-28' : 'section-gap',
    ]"
  >
    <div
      v-if="!hideHeader"
      class="flex flex-wrap items-end justify-between gap-x-10 gap-y-6"
    >
      <div class="flex max-w-3xl flex-col gap-4">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h2 :id="headingId" class="section-title">{{ title }}</h2>
        <p v-if="description" class="lead mt-1 max-w-2xl">
          {{ description }}
        </p>
      </div>
      <NuxtLink
        v-if="to"
        :to="to"
        class="group/all -mx-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-1 text-sm font-medium [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span
          class="underline decoration-black/25 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 ease-out group-hover/all:decoration-current"
        >
          {{ $t("common.seeAll") }}
        </span>
        <IconArrow
          class="size-3.5 transition-[translate] duration-150 ease-out motion-safe:group-hover/all:translate-x-0.5"
        />
      </NuxtLink>
    </div>

    <IPBSkeleton
      v-if="pending"
      variant="card"
      :count="Math.min(initialCount, 6)"
      :class="hideHeader ? '' : 'mt-12'"
    />

    <template v-else-if="articles?.length">
      <ul
        :class="[
          'grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3',
          hideHeader ? '' : 'mt-12',
        ]"
      >
        <li
          v-for="(article, index) in visibleArticles"
          :key="article.documentId"
          :class="[
            'reveal flex',
            isFeatured(index) && 'lg:col-span-2 lg:row-span-2',
          ]"
          :style="{ '--reveal-delay': `${(index % 3) * 100}ms` }"
        >
          <IPBArticleCard
            class="w-full"
            :title="article.title"
            :slug="article.slug"
            :category="
              showCategory ? (article.category?.name ?? undefined) : undefined
            "
            :image="article.main_image.url"
            :created-at="showDate ? article.createdAt : undefined"
            :read-time="article.read_time"
            :featured="isFeatured(index)"
            :priority="priority && index === 0"
          />
        </li>
      </ul>

      <!-- A "see all" link already leads to the full list; never offer both -->
      <div
        v-if="!to && (hasMore || canShowLess)"
        class="mt-14 flex flex-wrap justify-center gap-3"
      >
        <UiButton v-if="hasMore" variant="outline" @click="showMore">
          {{ $t("common.showMore") }}
        </UiButton>
        <UiButton v-if="canShowLess" variant="subtle" @click="showLess">
          {{ $t("common.showLess") }}
        </UiButton>
      </div>
    </template>

    <p v-else-if="emptyLabel" class="mt-10 text-neutral-500">
      {{ emptyLabel }}
    </p>
  </section>
</template>

<script setup lang="ts">
interface ArticleItem {
  documentId: string;
  title: string;
  slug: string;
  createdAt?: string;
  read_time?: number | null;
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
    /** The page above already titles this list (its h1). */
    hideHeader?: boolean;
    /** Give the first article the lead-story treatment on wide screens. */
    featured?: boolean;
    /** The list opens the page, so its first image is likely the largest paint. */
    priority?: boolean;
  }>(),
  {
    initialCount: 6,
    showCategory: false,
    showDate: true,
  }
);

const headingId = useId();

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

/** The lead story needs company: alone it would just be a wide card. */
function isFeatured(index: number) {
  return props.featured && index === 0 && visibleArticles.value.length >= 3;
}

function showMore() {
  visibleCount.value += props.initialCount;
}

function showLess() {
  visibleCount.value = props.initialCount;
}
</script>
