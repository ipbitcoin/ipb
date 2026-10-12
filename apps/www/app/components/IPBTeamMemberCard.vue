<template>
  <article class="flex h-full flex-col border-t border-black/10 pt-6">
    <div class="flex items-start justify-between gap-4">
      <!-- Kept small on purpose: most source photos are only 320px wide. -->
      <NuxtImg
        :src="image"
        :alt="name"
        width="112"
        height="112"
        fit="cover"
        loading="lazy"
        class="size-28 shrink-0 rounded-2xl bg-neutral-100 object-cover outline -outline-offset-1 outline-black/10"
      />
      <ul v-if="profiles.length" role="list" class="flex gap-2">
        <li v-for="profile in profiles" :key="profile.label">
          <a
            :href="profile.href"
            target="_blank"
            rel="noopener noreferrer"
            class="grid size-9 place-items-center rounded-full border border-black/15 bg-white text-neutral-700 shadow-button-light transition-[border-color,color,scale] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:border-black/30 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:active:scale-[0.96]"
          >
            <component :is="profile.icon" class="size-4" aria-hidden="true" />
            <span class="sr-only">
              {{ profile.label }}: {{ name }} ({{ $t("common.newTab") }})
            </span>
          </a>
        </li>
      </ul>
    </div>

    <h2
      class="mt-6 text-xl leading-snug font-medium tracking-[-0.015em] text-balance"
    >
      {{ name }}
    </h2>
    <p
      class="mt-2 font-mono text-[11px] leading-4 tracking-[0.08em] text-pretty text-neutral-500 uppercase"
    >
      {{ role }}
    </p>
    <p class="mt-4 text-[15px] leading-relaxed text-pretty text-neutral-600">
      {{ description }}
    </p>

    <!-- Same treatment as the "See all" link on article lists. -->
    <NuxtLink
      v-if="articlesTo"
      :to="articlesTo"
      :aria-label="$t('team.articlesBy', { name })"
      class="group/articles -mx-1 mt-3 inline-flex h-9 items-center gap-2 self-start rounded-full px-1 text-sm font-medium [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        class="underline decoration-black/25 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 ease-out group-hover/articles:decoration-current"
      >
        {{ $t("team.articles") }}
      </span>
      <IconArrow
        class="size-3.5 transition-[translate] duration-150 ease-out motion-safe:group-hover/articles:translate-x-0.5"
      />
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { IconLinkedIn, IconNostr } from "#components";

interface TeamMemberCardProps {
  image: string;
  name: string;
  role: string;
  description: string;
  linkedin?: string | null;
  nostr?: string | null;
  /** Their author page, when they write for the institute. */
  articlesTo?: string;
}

const props = defineProps<TeamMemberCardProps>();

const profiles = computed(() => [
  ...(props.linkedin
    ? [{ href: props.linkedin, icon: IconLinkedIn, label: "LinkedIn" }]
    : []),
  ...(props.nostr
    ? [{ href: props.nostr, icon: IconNostr, label: "Nostr" }]
    : []),
]);
</script>
