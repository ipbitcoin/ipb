<template>
  <!-- The one dark band on the page: it breaks the white rhythm between the
       article grids and gives the mission its own weight. -->
  <section
    id="values"
    :aria-labelledby="headingId"
    class="bg-neutral-950 text-white"
  >
    <div class="section section-gap">
      <div class="flex max-w-3xl flex-col gap-4">
        <p class="eyebrow text-white/50">{{ $t("values.eyebrow") }}</p>
        <h2 :id="headingId" class="section-title">{{ $t("values.title") }}</h2>
      </div>

      <IPBSkeleton
        v-if="pending"
        variant="tile"
        tone="dark"
        :count="6"
        class="mt-14"
      />

      <!-- 1px gaps over a lighter ground draw the hairlines between tiles,
           so every edge is shared and none is doubled. -->
      <ol
        v-else-if="values?.length"
        class="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
      >
        <li
          v-for="(value, index) in values"
          :key="value.title"
          class="bg-neutral-950"
        >
          <!-- Reveal the content, not the tile: a fading tile would flash
               the lighter ground behind it. -->
          <div
            class="reveal flex h-full min-h-64 flex-col justify-between gap-10 p-8 sm:p-10"
            :style="{ '--reveal-delay': `${(index % 3) * 100}ms` }"
          >
            <span
              aria-hidden="true"
              class="font-mono text-xs leading-4 font-medium text-brand tabular-nums"
            >
              {{ String(index + 1).padStart(2, "0") }}
            </span>
            <div class="flex flex-col gap-3">
              <h3 class="text-2xl leading-tight tracking-tight">
                {{ value.title }}
              </h3>
              <p class="leading-relaxed text-pretty text-white/60">
                {{ value.description }}
              </p>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
interface ValueItem {
  title: string;
  description: string;
}

defineProps<{
  values: ValueItem[] | null | undefined;
  pending?: boolean;
}>();

const headingId = useId();
</script>
