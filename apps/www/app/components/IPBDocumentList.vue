<template>
  <!-- A reference list, set like the FAQ: title column left, rows right. -->
  <section
    id="documents"
    :aria-labelledby="headingId"
    class="section section-gap"
  >
    <div class="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
      <div class="flex flex-col gap-4">
        <p class="eyebrow">{{ $t("documents.eyebrow") }}</p>
        <h2 :id="headingId" class="section-title">
          {{ $t("documents.title") }}
        </h2>
      </div>

      <IPBSkeleton v-if="pending" variant="list" :count="4" />

      <!-- Rows stay inside the content column; the divider is the only edge. -->
      <ul v-else-if="documents?.length" class="border-t border-black/10">
        <li
          v-for="doc in documents"
          :key="doc.documentId"
          class="border-b border-black/10"
        >
          <a
            :href="doc.document.url"
            target="_blank"
            rel="noopener"
            class="group/doc flex items-center gap-4 rounded-sm py-5 [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span
              aria-hidden="true"
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 transition-[background-color,color] duration-150 ease-out group-hover/doc:bg-neutral-950 group-hover/doc:text-white"
            >
              <IconDocument class="size-4.5" />
            </span>
            <span
              class="min-w-0 flex-1 text-lg leading-snug tracking-[-0.01em] text-pretty"
            >
              {{ doc.title }}
              <span class="sr-only">({{ $t("common.newTab") }})</span>
            </span>
            <span
              aria-hidden="true"
              class="hidden font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-neutral-500 uppercase transition-[color] duration-150 ease-out group-hover/doc:text-neutral-950 sm:inline"
            >
              {{ $t("documents.cta") }}
            </span>
            <!-- Turned up and out: this leaves the site. -->
            <IconArrow
              class="size-4 shrink-0 -rotate-45 text-neutral-400 transition-[translate,color] duration-150 ease-out group-hover/doc:text-neutral-950 motion-safe:group-hover/doc:translate-x-0.5 motion-safe:group-hover/doc:-translate-y-0.5"
            />
          </a>
        </li>
      </ul>

      <p v-else class="text-neutral-500">{{ $t("documents.empty") }}</p>
    </div>
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

const headingId = useId();
</script>
