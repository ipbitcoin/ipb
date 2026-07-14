<template>
  <article class="flex flex-col gap-2">
    <img :src="image" :alt="name" class="max-w-[300px] rounded-full" />
    <h3 class="text-4xl font-light text-balance">{{ name }}</h3>
    <div class="flex w-full justify-between items-center">
      <span class="uppercase text-lg">{{ role }}</span>
      <ul v-if="linkedin || nostr" class="flex items-center gap-3">
        <li v-if="linkedin">
          <NuxtLink :href="linkedin" external target="_blank">
            <IconLinkedIn class="size-7" />
          </NuxtLink>
        </li>
        <li v-if="nostr">
          <NuxtLink :href="nostr" external target="_blank">
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
