<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('author.eyebrow')"
      :title="profile.name"
      :description="profile.description ?? undefined"
    >
      <template #before>
        <NuxtImg
          :src="profile.picture.url"
          :alt="profile.name"
          width="96"
          height="96"
          fit="cover"
          loading="eager"
          class="size-20 rounded-full bg-neutral-100 object-cover outline -outline-offset-1 outline-black/10 sm:size-24"
        />
      </template>

      <UiButton
        v-if="profile.linkedin"
        variant="outline"
        :href="profile.linkedin"
        target="_blank"
        class="pl-3.5"
      >
        <IconLinkedIn class="size-4" aria-hidden="true" />
        LinkedIn
        <span class="sr-only">({{ $t("common.newTab") }})</span>
      </UiButton>
    </IPBPageHeader>

    <IPBArticleGrid
      :title="$t('author.articles')"
      :articles="articles"
      :pending="pending"
      :initial-count="9"
      :empty-label="$t('author.empty')"
      show-category
      hide-header
      priority
    />
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const route = useRoute();
const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const localePath = useLocalePath();

const slug = String(route.params.slug);

// Awaited: a missing author is a real 404, and the page's meta and
// structured data are built from it while it renders on the server.
const { data: author, error } = await useAsyncData(
  `author-${slug}-${locale.value}`,
  async () => {
    const [entry, team] = await Promise.all([
      convex.query(api.authors.getBySlug, { locale: appLocale.value, slug }),
      // Authors on the team borrow their bio, role and LinkedIn from it where
      // their author entry has none. The page works without it.
      convex
        .query(api.teamMembers.list, { locale: appLocale.value })
        .catch(() => []),
    ]);
    if (!entry) {
      return null;
    }
    const member = team.find(
      (person) => nameToSlug(person.name) === nameToSlug(entry.name)
    );
    return {
      ...entry,
      description: entry.description ?? member?.description ?? null,
      linkedin: entry.linkedin ?? member?.linkedin ?? null,
      role: member?.role ?? null,
    };
  }
);

if (!author.value) {
  throw createError({
    fatal: true,
    statusCode: error.value ? 500 : 404,
    statusMessage: error.value ? "Author unavailable" : "Author not found",
  });
}

// Same page instance per author and locale, so a snapshot is enough.
const profile = author.value;

const { data: articles, status } = useAsyncData(
  `author-articles-${slug}-${locale.value}`,
  () =>
    convex.query(api.articles.listPublished, {
      authorId: profile.documentId,
      locale: appLocale.value,
    }),
  { lazy: true, transform: toArticleSummaries }
);

const pending = computed(() => status.value === "pending");

const FALLBACK_DESCRIPTION = {
  en: `Articles and research by ${profile.name} at the Portuguese Bitcoin Institute.`,
  pt: `Artigos e investigação de ${profile.name} no Instituto Português de Bitcoin.`,
} as const;
const description =
  profile.description ?? FALLBACK_DESCRIPTION[appLocale.value];

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
// A portrait is square, so it is shared as a small card, not a wide one.
useSeoMeta({
  description,
  ogDescription: description,
  ogTitle: `${profile.name} | IPB`,
  ogType: "profile",
  title: profile.name,
  twitterCard: "summary",
  twitterDescription: description,
  twitterTitle: `${profile.name} | IPB`,
});
useShareImage({ alt: profile.name, url: profile.picture.url });

// A profile page about one Person: the same node as their article bylines
// and, for team members, the team page.
const personId = personSchemaId(profile.slug);

useSchemaOrg([
  defineWebPage({
    "@type": "ProfilePage",
    about: { "@id": personId },
    mainEntity: { "@id": personId },
  }),
  definePerson({
    "@id": personId,
    description: profile.description ?? undefined,
    image: profile.picture.url,
    jobTitle: profile.role ?? undefined,
    name: profile.name,
    sameAs: profile.linkedin ? [profile.linkedin] : undefined,
    url: localePath({ name: "autor-slug", params: { slug: profile.slug } }),
    worksFor: profile.role ? { "@id": identitySchemaId() } : undefined,
  }),
]);
</script>
