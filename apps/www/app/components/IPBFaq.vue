<template>
  <section id="faq" class="section section-gap">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
      <!-- Title column sticks while the questions scroll past -->
      <div class="lg:sticky lg:top-24 lg:self-start">
        <p class="eyebrow">{{ $t("faq.eyebrow") }}</p>
        <h2 class="section-title mt-4">{{ $t("faq.title") }}</h2>
        <p class="mt-5 max-w-sm text-black/60">{{ $t("faq.description") }}</p>
      </div>

      <IPBSkeleton v-if="pending" variant="text" :count="5" />

      <AccordionRoot v-else :collapsible="true" type="single">
        <AccordionItem
          v-for="(faq, index) in faqs ?? []"
          :key="faq.question"
          :value="String(index)"
          class="border-b border-black/10 first:border-t"
        >
          <AccordionHeader>
            <AccordionTrigger
              class="group focus-ring flex w-full cursor-pointer items-start justify-between gap-6 rounded py-6 text-left"
            >
              <span
                class="text-lg leading-snug font-medium text-balance transition-colors duration-150 ease-out group-hover:text-black/70 sm:text-xl"
              >
                {{ faq.question }}
              </span>
              <!-- Plus rotates into an X: one element, no icon swap -->
              <span
                aria-hidden="true"
                class="relative mt-1.5 size-4 shrink-0 transition-transform duration-300 ease-out group-data-[state=open]:rotate-[135deg]"
              >
                <span
                  class="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current"
                />
                <span
                  class="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current"
                />
              </span>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent
            class="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down"
          >
            <div class="flex max-w-2xl flex-col gap-3 pb-7 text-black/60">
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
}>();

function answerLines(answer: string): string[] {
  return answer.split("\n").filter((line) => line.trim().length > 0);
}
</script>
