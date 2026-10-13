<template>
  <PopoverRoot :modal="false">
    <PopoverTrigger
      :class="ICON_BUTTON"
      aria-label="Gerir etiquetas"
      title="Etiquetas"
    >
      <IconTag class="size-4" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="end"
        :side-offset="6"
        :class="POPOVER_CONTENT"
        class="flex max-h-[min(26rem,var(--reka-popover-content-available-height))] w-72 flex-col overflow-hidden"
      >
        <header
          class="flex h-10 shrink-0 items-center border-b border-neutral-200 px-3"
        >
          <h2 class="text-sm font-medium">Etiquetas</h2>
          <span class="ml-2 text-sm text-neutral-500 tabular-nums">
            {{ labels.length }}
          </span>
        </header>
        <ul
          v-if="labels.length > 0"
          class="flex min-h-0 flex-col overflow-y-auto overscroll-contain p-1"
        >
          <li
            v-for="item in labels"
            :key="item._id"
            class="group flex h-9 shrink-0 items-center gap-1 rounded-lg pr-1 transition-colors duration-100 hover:bg-neutral-50"
          >
            <BoardMenuSelect
              label="Cor"
              :model-value="item.color"
              :options="colorOptions"
              :trigger-class="ICON_BUTTON"
              @update:model-value="(color) => recolor(item, color)"
            >
              <template #trigger>
                <BoardLabelDot :color="item.color" />
              </template>
              <template #option="{ value }">
                <BoardLabelDot
                  v-if="value && isLabelColor(value)"
                  :color="value"
                />
              </template>
            </BoardMenuSelect>
            <input
              :value="item.name"
              type="text"
              :aria-label="`Nome de ${item.name}`"
              maxlength="40"
              class="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm text-neutral-900 outline-none transition-shadow duration-150 focus:bg-white focus:shadow-border"
              @keydown.enter.prevent="blurField"
              @change="(event) => rename(item, event)"
            />
            <span
              class="w-6 shrink-0 text-right text-xs text-neutral-400 tabular-nums"
              :title="`${uses(item._id)} ideias`"
            >
              {{ uses(item._id) }}
            </span>
            <button
              type="button"
              :class="ICON_BUTTON"
              class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              :aria-label="`Apagar ${item.name}`"
              @click="emit('remove', item)"
            >
              <IconTrash class="size-4" />
            </button>
          </li>
        </ul>
        <p
          v-else
          class="px-4 py-6 text-center text-sm text-balance text-neutral-500"
        >
          Ainda sem etiquetas. Crie-as ao escrever o nome numa ideia.
        </p>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import type { IdeaLabel } from "~/utils/boards";
import type { LabelColor } from "~/utils/palette";
import { LABEL_COLOR_NAMES, LABEL_COLORS } from "~/utils/palette";
import { ICON_BUTTON, POPOVER_CONTENT } from "~/utils/ui";

const props = defineProps<{
  labels: IdeaLabel[];
  /** How many ideas wear each label, by id. */
  usage: Map<string, number>;
}>();

const emit = defineEmits<{
  update: [label: IdeaLabel, changes: { name?: string; color?: LabelColor }];
  remove: [label: IdeaLabel];
}>();

const colorOptions = LABEL_COLORS.map((color) => ({
  label: LABEL_COLOR_NAMES[color],
  value: color,
}));

function isLabelColor(value: string): value is LabelColor {
  return LABEL_COLORS.some((color) => color === value);
}

function uses(id: string): number {
  return props.usage.get(id) ?? 0;
}

function recolor(item: IdeaLabel, color: string | null) {
  if (color && isLabelColor(color)) {
    emit("update", item, { color });
  }
}

/** Enter commits the name, as leaving the field does. */
function blurField(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) {
    event.target.blur();
  }
}

function rename(item: IdeaLabel, event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }
  const name = event.target.value.trim();
  if (!name) {
    event.target.value = item.name;
    return;
  }
  if (name !== item.name) {
    emit("update", item, { name });
  }
}
</script>
