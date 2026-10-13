<template>
  <div
    ref="element"
    role="button"
    tabindex="0"
    class="group/card"
    :class="CARD_SURFACE"
    @click="onClick"
    @keydown.enter.self.prevent="emit('open')"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useSortable } from "@dnd-kit/vue/sortable";

import { CARD_SURFACE } from "~/utils/ui";

const props = defineProps<{
  id: string;
  index: number;
  /** The column the card sits in; dnd-kit sorts within and across groups. */
  group: string;
}>();

const emit = defineEmits<{ open: [] }>();

const element = useTemplateRef<HTMLElement>("element");

useSortable({
  accept: "card",
  element,
  group: () => props.group,
  id: () => props.id,
  index: () => props.index,
  type: "card",
});

/** Clicks on the card's own controls are theirs, not the card's. */
function onClick(event: MouseEvent) {
  const control =
    event.target instanceof Element
      ? event.target.closest("button, a, input")
      : null;
  if (
    control &&
    event.currentTarget instanceof Element &&
    event.currentTarget.contains(control)
  ) {
    return;
  }
  emit("open");
}
</script>
