<template>
  <section id="faq" :aria-labelledby="headingId" class="section section-gap">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
      <!-- Title column sticks below the header while the questions scroll -->
      <div class="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        <p class="eyebrow">{{ eyebrow ?? $t("faq.eyebrow") }}</p>
        <h2 :id="headingId" class="section-title">
          {{ title ?? $t("faq.title") }}
        </h2>
        <p class="lead mt-1 max-w-sm">
          {{ description ?? $t("faq.description") }}
        </p>
        <div v-if="$slots.default" class="mt-4 flex flex-wrap gap-3">
          <slot />
        </div>
      </div>

      <IPBSkeleton v-if="pending" variant="list" :count="6" />

      <AccordionRoot
        v-else-if="faqs?.length"
        collapsible
        type="single"
        class="border-t border-black/10"
      >
        <AccordionItem
          v-for="(faq, index) in faqs"
          :key="faq.question"
          :value="String(index)"
          class="border-b border-black/10"
        >
          <AccordionHeader>
            <AccordionTrigger
              class="group/q flex w-full cursor-pointer items-center justify-between gap-6 rounded-sm py-6 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span
                class="text-lg leading-snug font-medium tracking-[-0.01em] text-pretty sm:text-xl"
              >
                {{ faq.question }}
              </span>
              <!-- The ring fills when open, so the state reads without motion;
                   the plus turns into a close mark on top of that. -->
              <span
                aria-hidden="true"
                class="grid size-8 shrink-0 place-items-center rounded-full border border-transparent text-neutral-950 shadow-border transition-[background-color,color,box-shadow] duration-150 ease-out group-hover/q:shadow-border-hover group-data-[state=open]/q:bg-neutral-950 group-data-[state=open]/q:text-white group-data-[state=open]/q:shadow-button-dark"
              >
                <IconPlus
                  class="size-3.5 transition-[rotate] duration-200 ease-out group-data-[state=open]/q:rotate-45"
                />
              </span>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent
            class="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down"
          >
            <!-- Right padding matches the toggle column, so answers line up
                 with their question instead of running under the ring. -->
            <div
              class="flex max-w-2xl flex-col gap-3 pr-14 pb-7 leading-relaxed text-pretty text-neutral-600"
            >
              <p
                v-for="(line, lineIndex) in answerLines(faq.answer)"
                :key="lineIndex"
              >
                {{ line }}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>
    </div>
  </section>
</template>

<script setup lang="ts">
interface FaqItem {
  question: string;
  answer: string;
}

defineProps<{
  faqs: FaqItem[] | null | undefined;
  pending?: boolean;
  /** Each heading falls back to the home page's general FAQ copy. */
  eyebrow?: string;
  title?: string;
  description?: string;
}>();

const headingId = useId();

function answerLines(answer: string): string[] {
  return answer.split("\n").filter((line) => line.trim().length > 0);
}
</script>
