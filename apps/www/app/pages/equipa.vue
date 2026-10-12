<template>
  <div>
    <IPBPageHeader
      :eyebrow="$t('team.eyebrow')"
      :title="$t('nav.team')"
      :description="$t('team.description')"
    />

    <div class="section pt-12 pb-20 sm:pt-16 sm:pb-28">
      <ul
        role="list"
        class="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16"
      >
        <li
          v-for="(member, index) in team"
          :key="member.documentId"
          class="reveal"
          :style="{ '--reveal-delay': `${(index % 3) * 100}ms` }"
        >
          <IPBTeamMemberCard
            :name="member.name"
            :role="member.role"
            :description="member.description"
            :linkedin="member.linkedin"
            :nostr="member.nostr"
            :image="member.picture.url"
            :articles-to="
              member.authorSlug
                ? localePath({
                    name: 'autor-slug',
                    params: { slug: member.authorSlug },
                  })
                : undefined
            "
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();
const localePath = useLocalePath();

const SEO = {
  en: {
    description:
      "Meet the team of the Portuguese Bitcoin Institute — the experts behind the mission of making Portugal a Bitcoin reference.",
    title: "Team",
  },
  pt: {
    description:
      "Conheça a equipa do Instituto Português de Bitcoin — os especialistas por trás da missão de tornar Portugal uma referência Bitcoin.",
    title: "Equipa",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.title} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.title} | IPB`,
});

// Awaited rather than lazy: the structured data below is built from it while
// the page renders on the server.
const { data: team, error } = await useAsyncData(
  `team-${locale.value}`,
  async () => {
    const [members, authors] = await Promise.all([
      convex.query(api.teamMembers.list, { locale: appLocale.value }),
      // Only links the members who also write; the team shows without it.
      convex
        .query(api.authors.list, { locale: appLocale.value })
        .catch(() => []),
    ]);
    const authorSlugs = new Map(
      authors.map((author) => [nameToSlug(author.name), author.slug])
    );
    return members.map((member) => ({
      ...member,
      authorSlug: authorSlugs.get(nameToSlug(member.name)) ?? null,
    }));
  }
);

if (error.value) {
  throw createError({
    fatal: true,
    statusCode: 500,
    statusMessage: "Team unavailable",
  });
}

// One Person per member, tied to the institute. Members who write share
// their node with their author page and article bylines.
useSchemaOrg(
  (team.value ?? []).map((member) => {
    const profiles = [member.linkedin, member.nostr].filter(
      (url): url is string => Boolean(url)
    );
    return definePerson({
      "@id": personSchemaId(member.authorSlug ?? nameToSlug(member.name)),
      description: member.description,
      image: member.picture.url,
      jobTitle: member.role,
      name: member.name,
      sameAs: profiles.length > 0 ? profiles : undefined,
      url: member.authorSlug
        ? localePath({
            name: "autor-slug",
            params: { slug: member.authorSlug },
          })
        : undefined,
      worksFor: { "@id": identitySchemaId() },
    });
  })
);
</script>
