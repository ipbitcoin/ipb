<template>
  <div v-if="page">
    <article>
      <!-- One centred reading column: header, then the cover a little wider,
           then the text. The header stages in like every page header. -->
      <header class="section pt-14 sm:pt-20">
        <div class="mx-auto max-w-2xl">
          <div
            class="enter mb-10 flex flex-wrap items-center gap-x-2.5 gap-y-1"
          >
            <IPBBackLink :to="section.path">{{ section.label }}</IPBBackLink>
            <template v-if="category">
              <span aria-hidden="true" class="text-[11px] text-neutral-300">
                /
              </span>
              <NuxtLink
                :to="category.path"
                class="-mx-1.5 -my-2 rounded-sm px-1.5 py-2 font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-neutral-500 uppercase transition-[color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {{ category.name }}
              </NuxtLink>
            </template>
          </div>

          <h1
            class="enter text-4xl leading-[1.08] tracking-[-0.035em] text-balance sm:text-5xl"
          >
            {{ article.title }}
          </h1>

          <div
            class="enter mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-black/10 py-5"
            style="--enter-delay: 100ms"
          >
            <div class="flex min-w-0 items-center gap-3.5">
              <div class="flex shrink-0 -space-x-2">
                <NuxtImg
                  v-for="author in article.authors"
                  :key="author.slug"
                  :src="author.picture.url"
                  alt=""
                  width="40"
                  height="40"
                  fit="cover"
                  class="size-10 rounded-full bg-neutral-100 object-cover ring-2 ring-white outline -outline-offset-1 outline-black/10"
                />
              </div>
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm leading-5 font-medium text-pretty">
                  <span class="text-neutral-500">{{ $t("common.by") }}</span>
                  {{ " " }}
                  <template v-for="part in authorParts" :key="part.key">
                    <NuxtLink v-if="part.to" :to="part.to" class="link">{{
                      part.text
                    }}</NuxtLink>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </p>
                <p
                  class="font-mono text-[11px] leading-4 tracking-[0.08em] text-neutral-500 uppercase"
                >
                  <NuxtTime
                    class="tabular-nums"
                    :datetime="article.createdAt"
                    :locale="locale"
                    day="numeric"
                    month="long"
                    year="numeric"
                  />
                  <template v-if="article.read_time">
                    <span aria-hidden="true" class="mx-2">·</span>
                    <span class="tabular-nums">
                      {{ $t("article.minRead", { count: article.read_time }) }}
                    </span>
                  </template>
                </p>
              </div>
            </div>

            <UiButton
              v-if="article.audio && !listening"
              variant="outline"
              size="sm"
              class="pl-3"
              @click="listen"
            >
              <IconHeadphones class="size-4" />
              {{ $t("article.listenToAudio") }}
            </UiButton>
          </div>

          <!-- The player replaces the button, so it takes focus and starts. -->
          <div
            v-if="article.audio && listening"
            class="mt-5 flex flex-col gap-2"
          >
            <audio ref="player" controls preload="none" class="w-full">
              <source :src="article.audio.url" type="audio/mp4" />
            </audio>
            <p class="text-xs text-neutral-500">
              {{ $t("article.generated") }}
            </p>
          </div>
        </div>
      </header>

      <!-- The card image morphs into this frame (view transition), so the
           frame itself carries the name and clips the image to its radius. -->
      <div class="section mt-10 sm:mt-14">
        <div
          class="relative mx-auto aspect-3/2 max-w-4xl overflow-hidden rounded-2xl bg-neutral-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline after:-outline-offset-1 after:outline-black/10"
          :style="{ viewTransitionName: `article-image-${article.slug}` }"
        >
          <NuxtImg
            :src="article.main_image.url"
            :alt="article.title"
            sizes="xs:100vw lg:896px"
            loading="eager"
            fetchpriority="high"
            class="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>

      <div class="section pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div class="mx-auto max-w-2xl">
          <div class="article-timeline">
            <!-- Reading progress, driven by scrolling through the text: no
                 JavaScript, and absent where the browser lacks support. -->
            <div
              aria-hidden="true"
              class="reading-progress pointer-events-none fixed inset-x-0 top-16 z-40 h-0.5 bg-brand xl:top-19"
            />
            <MDC
              :value="article.content"
              class="article-body prose prose-neutral max-w-none sm:prose-lg"
            />
          </div>

          <div
            class="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6"
          >
            <p class="eyebrow">{{ $t("article.share") }}</p>
            <div class="flex items-center gap-2">
              <a
                v-for="network in shareLinks"
                :key="network.name"
                :href="network.href"
                target="_blank"
                rel="noopener noreferrer"
                :class="ICON_BUTTON"
              >
                <component :is="network.icon" class="size-4" />
                <span class="sr-only">
                  {{ $t("article.shareOn", { network: network.name }) }}
                  ({{ $t("common.newTab") }})
                </span>
              </a>
              <button
                type="button"
                :class="ICON_BUTTON"
                :aria-label="$t('article.copyLink')"
                @click="copyLink"
              >
                <!-- Both icons stay mounted so the swap cross-fades. -->
                <IconCheck
                  class="size-4 transition-[opacity,filter,scale] duration-300 ease-swap [grid-area:1/1]"
                  :class="copied ? SWAP_IN : SWAP_OUT"
                />
                <IconClipboard
                  class="size-4 transition-[opacity,filter,scale] duration-300 ease-swap [grid-area:1/1]"
                  :class="copied ? SWAP_OUT : SWAP_IN"
                />
              </button>
              <span class="sr-only" aria-live="polite">
                {{ copied ? $t("article.linkCopied") : "" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>

    <!-- Only when the section has other articles: an empty block would show
         a heading and a "see all" link with nothing under them. -->
    <template v-if="relatedPending || related?.length">
      <div class="section">
        <div class="border-t border-black/10" />
      </div>

      <IPBArticleGrid
        :title="$t('article.related')"
        :articles="related"
        :pending="relatedPending"
        :initial-count="3"
        :to="section.path"
        show-category
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

import { IconLinkedIn, IconX } from "#components";

const { locale, t } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const route = useRoute();
const localePath = useLocalePath();
const setI18nParams = useSetI18nParams();
const site = useSiteConfig();

const slug = String(route.params.slug);

const ICON_BUTTON =
  "relative grid size-10 cursor-pointer place-items-center rounded-full border border-black/15 bg-white text-neutral-950 shadow-button-light transition-[background-color,border-color,scale] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:border-black/30 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:active:scale-[0.96]";
// Scale and blur only run when the user allows motion; opacity always fades.
const SWAP_IN = "opacity-100 motion-safe:scale-100 motion-safe:blur-[0px]";
const SWAP_OUT = "opacity-0 motion-safe:scale-25 motion-safe:blur-xs";

// Where an article lives on the site, by the type of its category.
const SECTIONS = {
  education: { label: "nav.education", route: "educacao" },
  news: { label: "nav.news", route: "noticias" },
  research: { label: "nav.research", route: "investigacao" },
} as const;

function articlePath(articleSlug: string) {
  return localePath({ name: "artigo-slug", params: { slug: articleSlug } });
}

// Awaited: the title, description, cover and structured data are built from
// it and must be in the server-rendered HTML. The slug pair gives this
// article's address in the other language, for the language switcher and
// the hreflang links.
const { data, error } = await useAsyncData(
  `article-${slug}-${locale.value}`,
  async () => {
    const [article, slugs] = await Promise.all([
      convex.query(api.articles.getBySlug, { locale: appLocale.value, slug }),
      convex.query(api.articles.getSlugPair, {
        locale: appLocale.value,
        slug,
      }),
    ]);

    if (!article) {
      // The old language switcher kept the other language's slug in the
      // address. Send those links to the right one, if it is published.
      const otherLocale = appLocale.value === "pt" ? "en" : "pt";
      const pair = await convex.query(api.articles.getSlugPair, {
        locale: otherLocale,
        slug,
      });
      const moved = pair?.[appLocale.value];
      if (!moved || moved === slug) {
        return null;
      }
      const target = await convex.query(api.articles.getBySlug, {
        locale: appLocale.value,
        slug: moved,
      });
      return target ? { movedTo: moved } : null;
    }

    return {
      article,
      slugs: { en: slugs?.en || slug, pt: slugs?.pt || slug },
    };
  }
);

// Narrowed by value, not with `in`: TypeScript gives each returned shape the
// other's keys as optional `undefined`, so `in` would not tell them apart.
const result = data.value;
const page = result?.article ? result : null;

if (result?.movedTo) {
  // Permanent, so search engines swap the old address for the new one.
  await navigateTo(articlePath(result.movedTo), {
    redirectCode: 301,
    replace: true,
  });
} else if (!page) {
  throw createError({
    fatal: true,
    statusCode: error.value ? 500 : 404,
    statusMessage: error.value ? "Article unavailable" : "Article not found",
  });
}

// Typed for the template, which only renders when `page` is set.
const article = page?.article as NonNullable<typeof page>["article"];

const section = computed(() => {
  const entry = SECTIONS[article?.category?.type ?? "news"] ?? SECTIONS.news;
  return { label: t(entry.label), path: localePath(entry.route) };
});

// Research articles also link to their theme.
const category = computed(() =>
  article?.category?.type === "research"
    ? {
        name: article.category.name,
        path: localePath({
          name: "investigacao-categoria",
          params: { categoria: article.category.slug },
        }),
      }
    : null
);

// "By Ana, Rui and Inês", with each name linking to its author page.
const authorParts = computed(() => {
  const authors = article?.authors ?? [];
  const parts: { key: string; text: string; to?: string }[] = [];
  let next = 0;
  for (const [index, part] of new Intl.ListFormat(locale.value, {
    type: "conjunction",
  })
    .formatToParts(authors.map((author) => author.name))
    .entries()) {
    const author = part.type === "element" ? authors[next] : undefined;
    if (author) {
      next += 1;
      parts.push({
        key: author.slug,
        text: part.value,
        to: localePath({ name: "autor-slug", params: { slug: author.slug } }),
      });
    } else {
      parts.push({ key: `literal-${index}`, text: part.value });
    }
  }
  return parts;
});

const listening = ref(false);
const player = useTemplateRef<HTMLAudioElement>("player");

async function listen() {
  listening.value = true;
  await nextTick();
  player.value?.focus();
  try {
    await player.value?.play();
  } catch {
    // Playback was refused; the controls are there to start it by hand.
  }
}

const shareUrl = computed(() =>
  article ? new URL(articlePath(article.slug), site.url).href : ""
);

const shareLinks = computed(() => {
  const url = encodeURIComponent(shareUrl.value);
  const text = encodeURIComponent(article?.title ?? "");
  return [
    {
      href: `https://x.com/intent/tweet?text=${text}&url=${url}&via=ipbitcoin`,
      icon: IconX,
      name: "X",
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      icon: IconLinkedIn,
      name: "LinkedIn",
    },
  ];
});

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
  } catch {
    return;
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onBeforeUnmount(() => clearTimeout(copiedTimer));

// More from the same section. The server still waits for it, so the links are
// in the HTML for search engines; `lazy` only lets client-side navigation show
// the article before these arrive.
const { data: related, status: relatedStatus } = useAsyncData(
  `related-${slug}-${locale.value}`,
  async () => {
    const categoryType = article?.category?.type;
    if (!categoryType) {
      return [];
    }
    return await convex.query(api.articles.listPublished, {
      categoryType,
      excludeSlug: slug,
      limit: 3,
      locale: appLocale.value,
    });
  },
  { lazy: true, transform: toArticleSummaries }
);

const relatedPending = computed(() => relatedStatus.value === "pending");

if (page) {
  setI18nParams({
    en: { slug: page.slugs.en },
    pt: { slug: page.slugs.pt },
  });

  const cover = article.main_image.url;
  const authorNames = article.authors.map((author) => author.name);
  const excerpt = toExcerpt(article.content);
  // A body that is mostly an embed leaves too little to describe it.
  const description =
    excerpt.length >= 80
      ? excerpt
      : toExcerpt(`# ${article.title}\n\n${article.content}`);

  // Social titles skip the global "%s | Instituto Português de Bitcoin"
  // template, so they carry the plain headline, as before.
  useSeoMeta({
    articleAuthor: authorNames,
    articleModifiedTime: article.updatedAt,
    articlePublishedTime: article.createdAt,
    articleSection: article.category?.name,
    articleTag: article.category ? [article.category.name] : undefined,
    description,
    ogDescription: description,
    ogTitle: article.title,
    ogType: "article",
    title: article.title,
    twitterData1: authorNames.join(", ") || "IPB",
    twitterData2: article.read_time
      ? t("article.minRead", { count: article.read_time })
      : undefined,
    twitterDescription: description,
    twitterLabel1: appLocale.value === "pt" ? "Autor" : "Author",
    twitterLabel2: article.read_time ? t("article.readingTime") : undefined,
    twitterTitle: article.title,
  });
  useShareImage({ alt: article.title, url: cover });

  // Joins the site-wide schema.org graph: the Article is linked to this web
  // page, and the Organization (the institute) is its publisher.
  useSchemaOrg([
    defineArticle({
      articleSection: article.category ? [article.category.name] : undefined,
      author: article.authors.map((author) => ({
        "@id": personSchemaId(author.slug),
        name: author.name,
        url: localePath({ name: "autor-slug", params: { slug: author.slug } }),
      })),
      dateModified: article.updatedAt,
      datePublished: article.createdAt,
      description,
      headline: article.title,
      image: cover,
    }),
    defineBreadcrumb({
      itemListElement: [
        { item: localePath("index"), name: t("seo.title") },
        { item: section.value.path, name: section.value.label },
        ...(category.value
          ? [{ item: category.value.path, name: category.value.name }]
          : []),
        { item: articlePath(article.slug), name: article.title },
      ],
    }),
  ]);
}
</script>
