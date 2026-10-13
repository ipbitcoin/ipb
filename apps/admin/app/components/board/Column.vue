<template>
  <section
    ref="element"
    class="flex min-h-0 flex-col rounded-2xl bg-neutral-950/3.5"
  >
    <h2
      class="flex h-10 shrink-0 items-center gap-2 px-3.5 pt-2 text-sm font-medium text-neutral-900"
    >
      <BoardStatusIcon :icon="column.icon" />
      <span class="truncate">{{ column.label }}</span>
      <span class="font-normal text-neutral-500 tabular-nums">
        {{ cards.length }}
      </span>
    </h2>
    <!-- Scrolls on its own under the header, so the page stays put. -->
    <div
      class="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain p-2"
    >
      <BoardCard
        v-for="(card, index) in cards"
        :id="card._id"
        :key="card._id"
        :index="index"
        :group="column.key"
        @open="emit('open', card)"
      >
        <slot name="card" :card="card" />
      </BoardCard>
      <BoardQuickAdd
        label="Adicionar"
        :placeholder="quickAddPlaceholder"
        @add="(title) => emit('quickAdd', title)"
      />
    </div>
  </section>
</template>

<script setup lang="ts" generic="T extends BoardCard">
import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/vue";

import type { BoardCard, BoardColumn } from "~/utils/boards";

const props = defineProps<{
  column: BoardColumn;
  cards: T[];
  quickAddPlaceholder: string;
}>();

const emit = defineEmits<{
  open: [card: T];
  quickAdd: [title: string];
}>();

defineSlots<{ card: (props: { card: T }) => unknown }>();

const element = useTemplateRef<HTMLElement>("element");

// Low priority: a card under the pointer wins over the column around it.
useDroppable({
  accept: "card",
  collisionPriority: CollisionPriority.Low,
  element,
  id: () => props.column.key,
  type: "column",
});
</script>
