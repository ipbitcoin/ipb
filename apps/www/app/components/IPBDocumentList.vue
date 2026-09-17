<template>
  <!-- Deliberately low-key: a reference list, not a feature grid. -->
  <section id="documents" class="section section-gap">
    <p class="eyebrow">{{ $t("documents.eyebrow") }}</p>
    <h2 class="mt-4 text-2xl font-light">{{ $t("documents.title") }}</h2>

    <IPBSkeleton v-if="pending" variant="text" :count="3" class="mt-8" />

    <ul v-else-if="documents?.length" class="mt-8 max-w-3xl">
      <li v-for="doc in documents" :key="doc.documentId">
        <NuxtLink
          :to="doc.document.url"
          target="_blank"
          external
          class="focus-ring group flex items-center justify-between gap-6 border-t border-black/10 py-4 transition-colors duration-150 ease-out hover:bg-black/[0.02]"
        >
          <span class="flex min-w-0 items-center gap-3">
            <IconDocument
              class="size-4 shrink-0 text-black/35 transition-colors duration-150 ease-out group-hover:text-black/70"
            />
            <span class="truncate text-sm">{{ doc.title }}</span>
          </span>
          <span
            class="shrink-0 text-xs tracking-wider text-black/40 uppercase transition-colors duration-150 ease-out group-hover:text-black"
          >
            {{ $t("documents.cta") }}
            <span
              class="inline-block transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              aria-hidden="true"
              >&rarr;</span
            >
          </span>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="mt-8 text-sm text-black/50">{{ $t("documents.empty") }}</p>
  </section>
</template>

<script setup lang="ts">
interface DocumentItem {
  documentId: string;
  title: string;
  document: { url: string };
}

defineProps<{
  documents: DocumentItem[] | null | undefined;
  pending?: boolean;
}>();
</script>
