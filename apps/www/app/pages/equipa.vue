<template>
  <div>
    <main>
      <div class="section flex flex-col gap-4 pt-20 pb-16 sm:pt-28">
        <h1
          class="max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
        >
          {{ $t("nav.team") }}
        </h1>
        <IPBSkeleton v-if="pending" variant="card" :count="6" class="mt-10" />
        <div
          v-else
          class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-12"
        >
          <IPBTeamMemberCard
            v-for="member in team"
            :key="member.name"
            :name="member.name"
            :role="member.role"
            :description="member.description"
            :linkedin="member.linkedin"
            :nostr="member.nostr"
            :image="member.picture.url"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { api } from "@ipb/backend/api";

const { locale } = useI18n();
const appLocale = useAppLocale();
const convex = useConvex();

useSeoMeta({
  description:
    locale.value === "pt"
      ? "Conheça a equipa do Instituto Português de Bitcoin — os especialistas por trás da missão de tornar Portugal uma referência Bitcoin."
      : "Meet the team of the Portuguese Bitcoin Institute — the experts behind the mission of making Portugal a Bitcoin reference.",
  ogDescription:
    locale.value === "pt"
      ? "Conheça a equipa do Instituto Português de Bitcoin."
      : "Meet the team of the Portuguese Bitcoin Institute.",
  ogTitle: locale.value === "pt" ? "Equipa | IPB" : "Team | IPB",
  title: locale.value === "pt" ? "Equipa" : "Team",
  twitterDescription:
    locale.value === "pt"
      ? "Conheça a equipa do Instituto Português de Bitcoin."
      : "Meet the team of the Portuguese Bitcoin Institute.",
  twitterTitle: locale.value === "pt" ? "Equipa | IPB" : "Team | IPB",
});

const { data: team, status } = useAsyncData(
  `team-${locale.value}`,
  () =>
    convex.query(api.teamMembers.list, {
      locale: appLocale.value,
    }),
  { lazy: true }
);

const pending = computed(() => status.value === "pending");

// Person schema — helps Google surface team members by name in search
watchEffect(() => {
  if (!team.value?.length) {
    return;
  }

  const baseUrl = "https://institutobitcoin.pt";
  const orgUrl = baseUrl;

  useHead({
    script: [
      {
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name:
            locale.value === "pt"
              ? "Equipa — Instituto Português de Bitcoin"
              : "Team — Portuguese Bitcoin Institute",
          itemListElement: team.value.map((member, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Person",
              name: member.name,
              jobTitle: member.role,
              description: member.description,
              image: member.picture?.url ?? undefined,
              worksFor: {
                "@type": "Organization",
                name: "Instituto Português de Bitcoin",
                url: orgUrl,
              },
              ...(member.linkedin ? { sameAs: [member.linkedin] } : {}),
              url: `${baseUrl}${locale.value === "en" ? "/en/team" : "/equipa"}`,
            },
          })),
        }),
        type: "application/ld+json",
      },
    ],
  });
});
</script>
