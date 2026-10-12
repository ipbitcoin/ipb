<template>
  <div class="flex h-full flex-col">
    <!-- The cover leads to the shop like the button below, for pointers only:
         it stays out of the tab order and the accessibility tree, so each
         book is announced and reached once. -->
    <component
      :is="url ? 'a' : 'div'"
      v-bind="coverLink"
      aria-hidden="true"
      class="group/cover flex aspect-4/5 items-center justify-center rounded-2xl bg-neutral-100 [-webkit-tap-highlight-color:transparent]"
    >
      <div
        class="relative w-[64%] transition-[translate] duration-300 ease-out motion-safe:group-hover/cover:-translate-y-1.5"
      >
        <!-- The lifted book's deeper shadow fades in, so the hover only
             animates opacity and translate. -->
        <span
          class="absolute inset-0 rounded-[3px] opacity-0 shadow-book-lift transition-opacity duration-300 ease-out group-hover/cover:opacity-100"
        />
        <div
          class="book-cover relative aspect-2/3 overflow-hidden rounded-[3px] bg-neutral-200 shadow-book"
        >
          <NuxtImg
            v-if="coverUrl"
            :src="coverUrl"
            :alt="title"
            :loading="eager ? 'eager' : 'lazy'"
            sizes="xs:30vw sm:20vw lg:180px"
            class="size-full object-cover"
          />
          <span
            v-else
            class="grid size-full place-items-center p-3 text-center text-xs text-pretty text-neutral-500"
          >
            {{ heading.title }}
          </span>
        </div>
      </div>
    </component>

    <div class="mt-5 flex grow flex-col">
      <h3
        class="text-base leading-snug tracking-[-0.015em] text-pretty sm:text-lg"
      >
        {{ heading.title }}
      </h3>
      <p
        v-if="heading.subtitle"
        class="mt-1 text-sm leading-snug text-pretty text-neutral-500 sm:text-[15px]"
      >
        {{ heading.subtitle }}
      </p>
      <p class="mt-2.5 text-sm text-pretty text-neutral-950">
        {{ authors }}
      </p>
      <!-- Each separator stays with the item before it, so a wrapped line
           never starts with one. -->
      <p
        v-if="meta.length"
        class="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[11px] leading-4 tracking-[0.08em] text-neutral-500 uppercase"
      >
        <span
          v-for="(item, index) in meta"
          :key="index"
          class="inline-flex gap-2 tabular-nums"
        >
          {{ item }}
          <span v-if="index < meta.length - 1" aria-hidden="true">·</span>
        </span>
      </p>
      <!-- Too narrow to be worth reading in the two-column phone grid. -->
      <p
        v-if="description"
        class="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600 max-sm:hidden"
      >
        {{ description }}
      </p>

      <div v-if="url" class="mt-auto pt-5">
        <UiButton variant="outline" size="sm" :href="url" target="_blank">
          {{ $t("education.books.buy") }}
          <span class="sr-only">{{ title }} ({{ $t("common.newTab") }})</span>
          <IconArrow class="size-3 -rotate-45" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  /** Comma-separated, as entered in the CMS. */
  author: string;
  coverUrl?: string;
  publisher?: string;
  year?: number;
  pages?: number;
  description?: string;
  url?: string;
  /** Above the fold: load the cover right away. */
  eager?: boolean;
}>();

const { locale, t } = useI18n();

// Titles come as "Title - Subtitle"; the subtitle reads as secondary.
const heading = computed(() => {
  const separator = /\s+[-–—]\s+/.exec(props.title);
  return separator
    ? {
        subtitle: props.title.slice(separator.index + separator[0].length),
        title: props.title.slice(0, separator.index),
      }
    : { subtitle: undefined, title: props.title };
});

// "A, B, C" from the CMS, read as a sentence: "A, B e C".
const authors = computed(() =>
  new Intl.ListFormat(locale.value).format(splitAuthors(props.author))
);

const meta = computed(() =>
  [
    props.publisher,
    props.year ? String(props.year) : undefined,
    props.pages
      ? t("education.books.pages", { count: props.pages })
      : undefined,
  ].filter((item): item is string => Boolean(item))
);

const coverLink = computed(() =>
  props.url
    ? {
        href: props.url,
        rel: "noopener noreferrer",
        tabindex: -1,
        target: "_blank",
      }
    : {}
);
</script>
