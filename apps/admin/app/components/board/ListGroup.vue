<template>
  <section ref="element" class="rounded-2xl bg-neutral-950/3.5 p-1.5">
    <CollapsibleRoot v-model:open="open">
      <!-- Opaque in the tray's own colour, so rows pass under it unseen. -->
      <div
        class="sticky top-0 z-10 flex h-9 items-center gap-1 rounded-lg bg-[color-mix(in_oklab,var(--color-neutral-950)_3.5%,var(--color-neutral-50))]"
      >
        <h2 class="flex h-full min-w-0 flex-1">
          <CollapsibleTrigger
            class="group flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg pl-1.5 text-sm font-medium text-neutral-900 outline-none focus-visible:outline-2 focus-visible:outline-brand"
          >
            <IconChevronRight
              class="size-3.5 shrink-0 text-neutral-400 transition-transform duration-200 ease-out group-data-[state=open]:rotate-90"
            />
            <BoardStatusIcon :icon="column.icon" />
            <span class="truncate">{{ column.label }}</span>
            <span class="font-normal text-neutral-500 tabular-nums">
              {{ cards.length }}
            </span>
          </CollapsibleTrigger>
        </h2>
        <button
          type="button"
          :class="ICON_BUTTON"
          :aria-label="`Adicionar em ${column.label}`"
          @click="emit('add')"
        >
          <IconPlus class="size-4" />
        </button>
      </div>
      <!-- Reaches into the tray's padding so the rows' edges aren't clipped. -->
      <CollapsibleContent
        class="-mx-1.5 -mb-1.5 overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
      >
        <div class="flex flex-col gap-1 px-1.5 pt-1 pb-1.5">
          <BoardCard
            v-for="(card, index) in cards"
            :id="card._id"
            :key="card._id"
            :index="index"
            :group="column.key"
            @open="emit('open', card)"
          >
            <slot name="row" :card="card" />
          </BoardCard>
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  </section>
</template>

<script setup lang="ts" generic="T extends BoardCard">
import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/vue";

import type { BoardCard, BoardColumn } from "~/utils/boards";
import { ICON_BUTTON } from "~/utils/ui";

const props = defineProps<{
  column: BoardColumn;
  cards: T[];
}>();

const open = defineModel<boolean>("open", { default: true });

const emit = defineEmits<{
  add: [];
  open: [card: T];
}>();

defineSlots<{ row: (props: { card: T }) => unknown }>();

const element = useTemplateRef<HTMLElement>("element");

// A folded group takes no drops: the card would vanish into it mid-drag.
useDroppable({
  accept: "card",
  collisionPriority: CollisionPriority.Low,
  disabled: () => !open.value,
  element,
  id: () => props.column.key,
  type: "group",
});
</script>
