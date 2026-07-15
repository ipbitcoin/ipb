<template>
  <div class="flex items-start gap-4 overflow-x-auto pb-4">
    <section
      v-for="column in columns"
      :key="column.key"
      class="flex w-64 shrink-0 flex-col gap-2 rounded border bg-white p-2"
      @dragover.prevent="onColumnDragOver(column.key)"
      @drop.prevent="onDrop(column.key)"
    >
      <header class="flex items-center justify-between px-1">
        <h2
          class="text-xs font-medium uppercase tracking-wider text-neutral-500"
        >
          {{ column.label }}
          <span class="ml-1 font-normal">{{ cardsIn(column.key).length }}</span>
        </h2>
        <button
          type="button"
          class="cursor-pointer rounded px-1.5 text-lg leading-none text-neutral-500 hover:bg-neutral-100"
          :aria-label="`Adicionar em ${column.label}`"
          @click="emit('add', column.key)"
        >
          +
        </button>
      </header>

      <div class="flex min-h-16 flex-col gap-2">
        <template v-for="(card, index) in cardsIn(column.key)" :key="card._id">
          <div
            v-if="isDropAt(column.key, index)"
            class="h-0.5 rounded bg-black"
          />
          <article
            draggable="true"
            class="cursor-grab rounded border bg-white p-3 text-sm shadow-sm hover:border-neutral-400"
            :class="card._id === draggingId ? 'opacity-40' : ''"
            @dragstart="onDragStart(card._id, $event)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onCardDragOver(column.key, index, $event)"
            @click="emit('open', card)"
          >
            <slot name="card" :card="card" />
          </article>
        </template>
        <div
          v-if="isDropAt(column.key, cardsIn(column.key).length)"
          class="h-0.5 rounded bg-black"
        />
      </div>
    </section>
  </div>
</template>

<script
  setup
  lang="ts"
  generic="T extends { _id: string; order: number; status: string }"
>
import type { BoardColumn } from "~/utils/boards";

const props = defineProps<{
  columns: BoardColumn[];
  cards: T[];
}>();

const emit = defineEmits<{
  add: [status: string];
  move: [payload: { id: string; order: number; status: string }];
  open: [card: T];
}>();

const draggingId = ref<string | null>(null);
const dropTarget = ref<{ index: number; status: string } | null>(null);

const byColumn = computed(() => {
  const map: Record<string, T[]> = {};
  for (const column of props.columns) {
    map[column.key] = [];
  }
  const sorted = [...props.cards].sort((a, b) => a.order - b.order);
  for (const card of sorted) {
    map[card.status]?.push(card);
  }
  return map;
});

function cardsIn(status: string): T[] {
  return byColumn.value[status] ?? [];
}

function isDropAt(status: string, index: number): boolean {
  return (
    draggingId.value !== null &&
    dropTarget.value?.status === status &&
    dropTarget.value.index === index
  );
}

function onDragStart(id: string, event: DragEvent) {
  draggingId.value = id;
  // dataTransfer payload is required for Firefox to start the drag
  event.dataTransfer?.setData("text/plain", id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function onDragEnd() {
  draggingId.value = null;
  dropTarget.value = null;
}

function onCardDragOver(status: string, index: number, event: DragEvent) {
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const rect = element.getBoundingClientRect();
  const below = event.clientY > rect.top + rect.height / 2;
  dropTarget.value = { index: below ? index + 1 : index, status };
}

// Fires only over empty column space — card handlers stop propagation.
function onColumnDragOver(status: string) {
  dropTarget.value = { index: cardsIn(status).length, status };
}

function onDrop(status: string) {
  const id = draggingId.value;
  const target =
    dropTarget.value?.status === status
      ? dropTarget.value
      : { index: cardsIn(status).length, status };
  draggingId.value = null;
  dropTarget.value = null;
  if (!id) {
    return;
  }

  const columnCards = cardsIn(status);
  const draggedIndex = columnCards.findIndex((card) => card._id === id);
  let index = Math.min(target.index, columnCards.length);
  if (draggedIndex !== -1) {
    // Dropped back onto its own slot — nothing to do.
    if (index === draggedIndex || index === draggedIndex + 1) {
      return;
    }
    if (draggedIndex < index) {
      index -= 1;
    }
  }

  const others = columnCards.filter((card) => card._id !== id);
  const before = others[index - 1];
  const after = others[index];
  let order = 1000;
  if (before && after) {
    order = (before.order + after.order) / 2;
  } else if (before) {
    order = before.order + 1000;
  } else if (after) {
    order = after.order - 1000;
  }

  emit("move", { id, order, status });
}
</script>
