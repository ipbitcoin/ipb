<template>
  <article class="flex flex-col gap-2">
    <img
      :src="image"
      :alt="name"
      loading="lazy"
      class="max-w-[300px] rounded-full outline -outline-offset-1 outline-black/10"
    />
    <h3 class="text-4xl font-light text-balance">{{ name }}</h3>
    <div class="flex w-full items-center justify-between">
      <span class="text-lg uppercase">{{ role }}</span>
      <ul v-if="linkedin || nostr" class="flex items-center gap-3">
        <li v-if="linkedin">
          <NuxtLink
            :href="linkedin"
            external
            target="_blank"
            :aria-label="`LinkedIn — ${name}`"
            class="focus-ring block rounded transition-opacity duration-150 ease-out hover:opacity-70"
          >
            <IconLinkedIn class="size-7" />
          </NuxtLink>
        </li>
        <li v-if="nostr">
          <NuxtLink
            :href="nostr"
            external
            target="_blank"
            :aria-label="`Nostr — ${name}`"
            class="focus-ring block rounded transition-opacity duration-150 ease-out hover:opacity-70"
          >
            <IconNostr class="size-6" />
          </NuxtLink>
        </li>
      </ul>
    </div>
    <p>{{ description }}</p>
  </article>
</template>

<script setup lang="ts">
interface TeamMemberCardProps {
  image: string;
  name: string;
  role: string;
  description: string;
  linkedin?: string;
  nostr?: string;
}

defineProps<TeamMemberCardProps>();
</script>
