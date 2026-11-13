<template>
  <div v-if="course">
    <IPBPageHeader
      :eyebrow="`${lang === 'en' ? 'Online course' : 'Curso online'} ${course.number} · ${course.tagline[lang]}`"
      :title="course.title[lang]"
      :description="course.description[lang]"
    >
      <template #before>
        <NuxtLink
          :to="localePath('curso-online')"
          class="link inline-flex items-center gap-2 text-sm text-neutral-600"
        >
          ←
          {{ lang === "en" ? "All online courses" : "Todos os cursos online" }}
        </NuxtLink>
      </template>
    </IPBPageHeader>

    <div
      class="section grid gap-12 pt-14 pb-20 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:pb-28"
    >
      <div class="flex min-w-0 flex-col gap-14">
        <section aria-labelledby="outcomes-heading">
          <h2
            id="outcomes-heading"
            class="text-2xl font-medium tracking-[-0.02em]"
          >
            {{
              lang === "en"
                ? "What you will be able to do"
                : "O que será possível fazer"
            }}
          </h2>
          <ul class="mt-5 flex flex-col gap-3">
            <li
              v-for="outcome in course.outcomes[lang]"
              :key="outcome"
              class="flex gap-3 text-pretty text-neutral-700"
            >
              <IconCheck class="mt-1 size-4 shrink-0 text-neutral-950" />
              {{ outcome }}
            </li>
          </ul>
        </section>

        <section aria-labelledby="syllabus-heading">
          <div class="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="syllabus-heading"
              class="text-2xl font-medium tracking-[-0.02em]"
            >
              {{ lang === "en" ? "Lessons" : "Lições" }}
            </h2>
            <p class="font-mono text-xs text-neutral-500">
              {{ lessons.length }} {{ copy.lessons }} · {{ copy.hours }}
            </p>
          </div>

          <div v-for="group in modules" :key="group.module" class="mt-8">
            <p class="eyebrow">
              {{
                group.module === 0
                  ? group.name
                  : `${lang === "en" ? "Module" : "Módulo"} ${group.module} · ${group.name}`
              }}
            </p>
            <ul class="mt-3 border-t border-black/10">
              <li
                v-for="lesson in group.lessons"
                :key="lesson.id"
                class="border-b border-black/10"
              >
                <component
                  :is="owned ? 'a' : 'div'"
                  :href="owned ? lessonUrl(lesson) : undefined"
                  class="focus-ring flex items-center gap-4 py-4"
                >
                  <span
                    class="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-mono"
                    :class="
                      isDone(lesson.id)
                        ? 'bg-neutral-950 text-white'
                        : 'bg-black/5 text-neutral-500'
                    "
                  >
                    <IconCheck v-if="isDone(lesson.id)" class="size-3" />
                    <template v-else>{{ lesson.id }}</template>
                  </span>
                  <span class="min-w-0 grow text-pretty">{{
                    lesson.title
                  }}</span>
                  <span class="shrink-0 font-mono text-xs text-neutral-500">
                    {{ lesson.minutes }} min
                  </span>
                </component>
              </li>
            </ul>
          </div>
          <p class="mt-6 text-sm text-neutral-500">{{ copy.contentNote }}</p>
        </section>
      </div>

      <aside class="lg:sticky lg:top-28 lg:self-start">
        <p
          v-if="route.query.status === 'cancel'"
          class="mb-4 rounded-xl bg-neutral-50 p-4 text-sm"
          role="status"
        >
          {{ copy.cancelled }}
        </p>

        <div
          v-if="owned && progress"
          class="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
        >
          <p class="eyebrow">
            {{ lang === "en" ? "Your progress" : "O progresso" }}
          </p>
          <div class="flex flex-col gap-2">
            <p class="text-3xl font-normal tracking-[-0.03em]">
              {{ percent }}%
            </p>
            <div class="h-1.5 overflow-hidden rounded-full bg-black/8">
              <div class="h-full bg-brand" :style="{ width: `${percent}%` }" />
            </div>
            <p class="text-sm text-neutral-600">
              {{ copy.progress(progress.completed.length, progress.total) }}
            </p>
          </div>
          <UiButton
            v-if="nextLesson"
            size="lg"
            arrow
            target="_self"
            :to="lessonUrl(nextLesson)"
          >
            {{ progress.completed.length ? copy.continue : copy.start }}
          </UiButton>
          <UiButton
            :variant="allDone ? 'primary' : 'outline'"
            size="lg"
            :to="
              localePath({
                name: 'curso-online-diploma-curso',
                params: { curso: course.slug },
              })
            "
          >
            {{ copy.diploma }}
          </UiButton>
        </div>

        <IPBCoursePurchase v-else :course="course.slug" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const lang = useAppLocale();
const localePath = useLocalePath();
const slug = String(route.params.curso);

const course = ONLINE_COURSES.find((c) => c.slug === slug);
if (!course) {
  throw createError({
    fatal: true,
    statusCode: 404,
    statusMessage: "Not found",
  });
}

const copy = computed(() => COURSE_COPY[lang.value]);
const { progressOf } = useCourseAccount();

const { data } = await useFetch<{ lessons: LessonSummary[] }>(
  `/api/curso/indice/${slug}`,
  { default: () => ({ lessons: [] }) }
);
const lessons = computed(() => data.value?.lessons ?? []);

const modules = computed(() => {
  const groups: { lessons: LessonSummary[]; module: number; name: string }[] =
    [];
  for (const lesson of lessons.value) {
    let group = groups.find((g) => g.module === lesson.module);
    if (!group) {
      group = { lessons: [], module: lesson.module, name: lesson.moduleName };
      groups.push(group);
    }
    group.lessons.push(lesson);
  }
  return groups;
});

const progress = computed(() => progressOf(slug));
const owned = computed(() => Boolean(progress.value));
const percent = computed(() =>
  progress.value?.total
    ? Math.round((progress.value.completed.length / progress.value.total) * 100)
    : 0
);
const allDone = computed(
  () =>
    Boolean(progress.value) &&
    progress.value?.completed.length === progress.value?.total
);
const nextLesson = computed(
  () =>
    lessons.value.find((l) => !progress.value?.completed.includes(l.id)) ??
    lessons.value[0]
);

const isDone = (id: string) => Boolean(progress.value?.completed.includes(id));
const lessonUrl = (lesson: LessonSummary) => `/aula/${slug}/${lesson.slug}`;

const title = computed(
  () =>
    `${lang.value === "en" ? "Online course" : "Curso online"} ${course.number}: ${course.title[lang.value]}`
);
useSeoMeta({
  description: () => course.description[lang.value],
  ogDescription: () => course.description[lang.value],
  ogTitle: () => `${title.value} | IPB`,
  title: () => title.value,
});
</script>
