<template>
  <!-- Call to action for the online courses, between the FAQ-style content and
       the partners. Dark, so it reads apart from the orange closing band. -->
  <section
    id="online-courses"
    aria-labelledby="online-courses-title"
    class="section section-gap"
  >
    <div
      class="reveal relative isolate overflow-hidden rounded-3xl bg-neutral-950 px-6 py-14 text-white sm:px-12 sm:py-16 lg:px-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.06)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_70%_100%_at_100%_0%,black,transparent_70%)]"
      />
      <div
        class="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16"
      >
        <div class="flex max-w-xl flex-col gap-5">
          <p class="eyebrow text-white/50">{{ copy.eyebrow }}</p>
          <h2 id="online-courses-title" class="section-title">
            {{ copy.title }}
          </h2>
          <p class="lead text-white/70">{{ copy.text }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            <UiButton
              size="lg"
              variant="brand"
              arrow
              :to="localePath('curso-online')"
            >
              {{ copy.cta }}
            </UiButton>
            <p class="font-mono text-xs text-white/60">{{ copy.price }}</p>
          </div>
        </div>

        <ol class="flex flex-col gap-3">
          <li v-for="course in ONLINE_COURSES" :key="course.slug">
            <NuxtLink
              :to="
                localePath({
                  name: 'curso-online-curso',
                  params: { curso: course.slug },
                })
              "
              class="group/row focus-ring flex items-center gap-4 rounded-2xl bg-white/6 p-4 transition-[background-color] duration-150 ease-out hover:bg-white/10 sm:p-5"
            >
              <span class="font-mono text-xs text-white/50"
                >0{{ course.number }}</span
              >
              <span class="flex min-w-0 grow flex-col">
                <span class="text-lg font-medium tracking-[-0.01em]">
                  {{ course.title[lang] }}
                </span>
                <span class="text-sm text-white/60">{{
                  course.tagline[lang]
                }}</span>
              </span>
              <IconArrow
                class="size-4 shrink-0 text-white/60 transition-[translate,color] duration-200 ease-out group-hover/row:text-brand motion-safe:group-hover/row:translate-x-1"
              />
            </NuxtLink>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const lang = useAppLocale();
const localePath = useLocalePath();

const COPY = {
  en: {
    cta: "See the online courses",
    eyebrow: "Online courses",
    price: "€39 each · members get a discount",
    text: "Three self-paced courses, from why money loses value to your first transaction. 100% online, with a diploma in your name at the end.",
    title: "Learn Bitcoin at your own pace",
  },
  pt: {
    cta: "Ver os cursos online",
    eyebrow: "Cursos online",
    price: "39 € cada · membros têm desconto",
    text: "Três cursos de autoestudo, de «porque é que o dinheiro perde valor» até à primeira transação. 100% online, com diploma em nome próprio no fim.",
    title: "Aprender Bitcoin ao ritmo de cada pessoa",
  },
} as const;
const copy = computed(() => COPY[lang.value]);
</script>
