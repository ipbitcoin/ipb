<template>
  <DragDropProvider
    v-if="shown.length > 0"
    :sensors="drag.sensors"
    @drag-start="drag.handlers.onDragStart"
    @drag-move="drag.handlers.onDragMove"
    @drag-over="drag.handlers.onDragOver"
    @drag-end="drag.handlers.onDragEnd"
  >
    <div class="flex flex-col gap-3">
      <BoardListGroup
        v-for="column in shown"
        :key="column.key"
        :column="column"
        :cards="drag.groups.value[column.key] ?? []"
        :open="!folded.has(column.key)"
        @update:open="(value) => setOpen(column.key, value)"
        @add="emit('add', column.key)"
        @open="(card) => emit('open', card)"
      >
        <template #row="{ card }">
          <slot name="row" :card="card" />
        </template>
      </BoardListGroup>
    </div>
  </DragDropProvider>
  <div v-else class="rounded-2xl bg-neutral-950/3.5">
    <slot name="empty" />
  </div>
</template>

<script setup lang="ts" generic="T extends BoardCard">
import { DragDropProvider } from "@dnd-kit/vue";

import type { BoardCard, BoardColumn, CardMove } from "~/utils/boards";

const props = defineProps<{
  /** Names where folded groups are remembered on this device. */
  storageKey: string;
  columns: BoardColumn[];
  cards: T[];
}>();

const emit = defineEmits<{
  add: [status: string];
  move: [moves: CardMove[]];
  open: [card: T];
}>();

defineSlots<{
  row: (props: { card: T }) => unknown;
  empty: () => unknown;
}>();

const groups = computed(() => groupByColumn(props.columns, props.cards));

const drag = useBoardDrag(
  () => groups.value,
  (moves) => emit("move", moves)
);

// Which groups show goes by the cards before the drag, so a group emptied by
// it stays put until the drop.
const shown = computed(() =>
  props.columns.filter((column) => (groups.value[column.key] ?? []).length > 0)
);

const foldedKeys = useStoredRef(
  `${props.storageKey}:folded`,
  "",
  (value): value is string => true
);

const folded = computed(
  () => new Set(foldedKeys.value.split(",").filter(Boolean))
);

function setOpen(key: string, open: boolean) {
  const next = new Set(folded.value);
  if (open) {
    next.delete(key);
  } else {
    next.add(key);
  }
  foldedKeys.value = [...next].join(",");
}
</script>
