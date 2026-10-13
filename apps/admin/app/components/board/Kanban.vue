<template>
  <DragDropProvider
    :sensors="drag.sensors"
    @drag-start="drag.handlers.onDragStart"
    @drag-move="drag.handlers.onDragMove"
    @drag-over="drag.handlers.onDragOver"
    @drag-end="drag.handlers.onDragEnd"
  >
    <!-- Bleeds into the page padding so columns scroll edge to edge. -->
    <div
      class="-mx-8 grid min-h-0 grow auto-cols-[minmax(17rem,1fr)] grid-flow-col grid-rows-1 gap-3 overflow-x-auto px-8 pb-1"
    >
      <BoardColumn
        v-for="column in columns"
        :key="column.key"
        :column="column"
        :cards="drag.groups.value[column.key] ?? []"
        :quick-add-placeholder="quickAddPlaceholder"
        @open="(card) => emit('open', card)"
        @quick-add="(title) => emit('quickAdd', column.key, title)"
      >
        <template #card="{ card }">
          <slot name="card" :card="card" />
        </template>
      </BoardColumn>
    </div>
  </DragDropProvider>
</template>

<script setup lang="ts" generic="T extends BoardCard">
import { DragDropProvider } from "@dnd-kit/vue";

import type { BoardCard, BoardColumn, CardMove } from "~/utils/boards";

const props = defineProps<{
  columns: BoardColumn[];
  cards: T[];
  quickAddPlaceholder: string;
}>();

const emit = defineEmits<{
  move: [moves: CardMove[]];
  open: [card: T];
  quickAdd: [status: string, title: string];
}>();

defineSlots<{ card: (props: { card: T }) => unknown }>();

const drag = useBoardDrag(
  () => groupByColumn(props.columns, props.cards),
  (moves) => emit("move", moves)
);
</script>
