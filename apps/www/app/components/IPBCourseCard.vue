<template>
  <article
    class="group/course relative flex h-full flex-col gap-6 rounded-2xl bg-white p-6 shadow-border transition-[box-shadow] duration-150 ease-out hover:shadow-border-hover sm:p-7"
  >
    <div class="flex items-center justify-between gap-4">
      <p class="eyebrow">
        {{ lang === "en" ? "Course" : "Curso" }} {{ course.number }}
      </p>
      <p class="font-mono text-xs text-neutral-500">{{ copy.hours }}</p>
    </div>

    <div class="flex flex-col gap-2">
      <h3
        class="text-3xl leading-[1.05] font-normal tracking-[-0.03em] text-balance"
      >
        <NuxtLink
          :to="coursePage"
          class="focus-ring rounded-sm after:absolute after:inset-0"
        >
          {{ course.title[lang] }}
        </NuxtLink>
      </h3>
      <p class="font-mono text-xs tracking-wide text-neutral-500 uppercase">
        {{ course.tagline[lang] }}
      </p>
    </div>

    <p class="text-pretty text-neutral-600">{{ course.description[lang] }}</p>

    <div class="mt-auto flex flex-col gap-4 border-t border-black/10 pt-5">
      <div v-if="progress" class="flex flex-col gap-2">
        <p class="text-sm text-neutral-600">
          {{ copy.progress(progress.completed.length, progress.total) }}
        </p>
        <div class="h-1.5 overflow-hidden rounded-full bg-black/8">
          <div class="h-full bg-brand" :style="{ width: `${percent}%` }" />
        </div>
      </div>
      <div v-else class="flex flex-col gap-1">
        <p class="text-2xl font-medium tracking-[-0.02em]">
          {{ formatEur(COURSE_PRICE_CENTS, lang) }}
        </p>
        <p class="font-mono text-[11px] text-neutral-500">
          {{ memberLine }}
        </p>
      </div>
      <span
        class="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-medium"
        aria-hidden="true"
      >
        {{ progress ? copy.continue : copy.seeCourse }}
        <IconArrow
          class="size-3.5 transition-[translate] duration-200 ease-out motion-safe:group-hover/course:translate-x-1"
        />
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ course: OnlineCourse }>();

const lang = useAppLocale();
const localePath = useLocalePath();
const copy = computed(() => COURSE_COPY[lang.value]);
const { progressOf } = useCourseAccount();

const progress = computed(() => progressOf(props.course.slug));
const percent = computed(() =>
  progress.value && progress.value.total
    ? Math.round((progress.value.completed.length / progress.value.total) * 100)
    : 0
);

const coursePage = computed(() =>
  localePath({
    name: "curso-online-curso",
    params: { curso: props.course.slug },
  })
);

const memberLine = computed(() => {
  const price1 = formatEur(coursePriceCents(1), lang.value);
  const price2 = formatEur(coursePriceCents(2), lang.value);
  return lang.value === "en"
    ? `Members: ${price1} · ${price2}`
    : `Membros: ${price1} · ${price2}`;
});
</script>
