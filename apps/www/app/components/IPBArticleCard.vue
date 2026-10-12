<template>
  <NuxtLink
    :to="localePath({ name: 'artigo-slug', params: { slug } })"
    class="group/card flex flex-col gap-5 rounded-2xl [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    @click="markAsTransitionTarget"
  >
    <!-- The outline sits on an overlay so the zoomed image never covers it.
         The frame is the shared element of the transition into the article
         page, so the image morphs with its rounded corners. The name is only
         applied while this card is the navigation target, because
         view-transition-name must be unique in the document. -->
    <div
      :class="[
        'relative overflow-hidden rounded-2xl bg-neutral-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline after:-outline-offset-1 after:outline-black/10',
        featured
          ? 'aspect-16/10 lg:aspect-auto lg:min-h-0 lg:flex-1'
          : 'aspect-16/10',
      ]"
      :style="transitionStyle"
    >
      <NuxtImg
        :src="image"
        alt=""
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : undefined"
        :sizes="
          featured ? 'xs:100vw sm:50vw lg:820px' : 'xs:100vw sm:50vw lg:400px'
        "
        class="absolute inset-0 size-full object-cover transition-[scale] duration-500 ease-out motion-safe:group-hover/card:scale-[1.03]"
      />
    </div>

    <div class="flex flex-col gap-2.5">
      <p
        v-if="meta.length"
        class="flex flex-wrap items-center gap-x-2 font-mono text-[11px] leading-4 tracking-[0.08em] text-neutral-500 uppercase"
      >
        <template v-for="(item, index) in meta" :key="item.key">
          <span v-if="index > 0" aria-hidden="true">·</span>
          <NuxtTime
            v-if="item.key === 'date'"
            class="tabular-nums"
            :datetime="item.value"
            :locale="locale"
            day="numeric"
            month="short"
            year="numeric"
          />
          <span v-else :class="item.key === 'category' && 'text-neutral-950'">
            {{ item.value }}
          </span>
        </template>
      </p>
      <h3
        :class="[
          'text-pretty decoration-black/25 decoration-1 underline-offset-4 group-hover/card:underline',
          featured
            ? 'text-2xl leading-tight tracking-tight sm:text-3xl'
            : 'text-xl leading-snug tracking-[-0.015em]',
        ]"
      >
        {{ title }}
      </h3>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const { locale, t } = useI18n();

interface ArticleCardProps {
  title: string;
  slug: string;
  category?: string;
  image: string;
  createdAt?: string;
  /** Minutes. */
  readTime?: number | null;
  /** Lead story: larger title, and the image fills a taller cell. */
  featured?: boolean;
  /** Likely the page's largest paint: the image loads at once, ahead of others. */
  priority?: boolean;
}

const props = defineProps<ArticleCardProps>();

const meta = computed(() => {
  const items: { key: string; value: string }[] = [];
  if (props.category) {
    items.push({ key: "category", value: props.category });
  }
  if (props.createdAt) {
    items.push({ key: "date", value: props.createdAt });
  }
  if (props.readTime) {
    items.push({
      key: "time",
      value: t("article.minRead", { count: props.readTime }),
    });
  }
  return items;
});

// Only the clicked card carries the name, so it stays unique in the document.
const isTransitionTarget = ref(false);

const transitionStyle = computed(() =>
  isTransitionTarget.value
    ? { viewTransitionName: `article-image-${props.slug}` }
    : undefined
);

function markAsTransitionTarget() {
  isTransitionTarget.value = true;
}

// Release the name once we land, so a card that survives the navigation
// (back button, related-articles grid) does not keep claiming it.
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    isTransitionTarget.value = false;
  }
);
</script>
