<template>
  <ToggleGroupRoot
    :model-value="layout"
    type="single"
    aria-label="Vista"
    class="relative isolate flex shrink-0 rounded-full bg-neutral-950/5 p-0.5"
    @update:model-value="pick"
  >
    <ToggleGroupItem
      v-for="item in ITEMS"
      :key="item.value"
      :value="item.value"
      :aria-label="item.label"
      :title="item.label"
      class="flex size-7 cursor-pointer items-center justify-center rounded-full text-neutral-500 outline-none transition-colors duration-150 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand data-[state=on]:text-neutral-900"
    >
      <component :is="item.icon" class="size-4" />
    </ToggleGroupItem>
    <!-- Slides between the two, so the current layout shows at a glance. -->
    <span
      aria-hidden="true"
      class="absolute top-0.5 left-0.5 -z-10 size-7 rounded-full bg-white shadow-border transition-[translate] duration-200 ease-out"
      :class="layout === 'list' ? 'translate-x-7' : ''"
    />
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
import type { BoardLayout } from "~/utils/boards";
import { isBoardLayout } from "~/utils/boards";

const layout = defineModel<BoardLayout>({ required: true });

const ITEMS = [
  { icon: resolveComponent("IconKanban"), label: "Quadro", value: "kanban" },
  { icon: resolveComponent("IconList"), label: "Lista", value: "list" },
];

// Pressing the current layout again would unpress it; it stays.
function pick(value: unknown) {
  if (typeof value === "string" && isBoardLayout(value)) {
    layout.value = value;
  }
}
</script>
