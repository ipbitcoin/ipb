<template>
  <div
    :class="
      layout === 'tile'
        ? 'flex flex-col gap-2.5 p-3'
        : 'flex h-11 items-center gap-3 px-3 text-sm'
    "
  >
    <template v-if="layout === 'tile'">
      <span
        class="line-clamp-3 text-sm leading-snug wrap-break-word text-neutral-900"
      >
        {{ idea.title }}
      </span>
      <span v-if="worn.length > 0" class="flex min-w-0 flex-wrap gap-1">
        <BoardLabelChip v-for="item in worn" :key="item._id" :label="item" />
      </span>
    </template>

    <span
      :class="
        layout === 'tile' ? 'flex min-h-5 items-center gap-2' : 'contents'
      "
    >
      <BoardMenuSelect
        :label="`Estado: ${column?.label ?? idea.status}`"
        :model-value="idea.status"
        :options="statusOptions"
        :trigger-class="INLINE_TRIGGER"
        @update:model-value="(status) => status && emit('update', { status })"
      >
        <template #trigger>
          <BoardStatusIcon v-if="column" :icon="column.icon" />
        </template>
        <template #option="{ value }">
          <BoardStatusIcon
            v-if="value"
            :icon="statusIcon(IDEA_COLUMNS, value)"
          />
        </template>
      </BoardMenuSelect>

      <template v-if="layout === 'row'">
        <span class="min-w-0 flex-1 truncate text-neutral-900">
          {{ idea.title }}
        </span>
        <!-- Rows show a few labels by name, then how many more. -->
        <span
          v-if="worn.length > 0"
          class="flex shrink-0 items-center gap-1 max-sm:hidden"
        >
          <BoardLabelChip
            v-for="item in worn.slice(0, ROW_LABELS)"
            :key="item._id"
            :label="item"
          />
          <span
            v-if="worn.length > ROW_LABELS"
            class="text-xs text-neutral-500 tabular-nums"
          >
            +{{ worn.length - ROW_LABELS }}
          </span>
        </span>
      </template>

      <span
        v-if="idea.platforms.length > 0"
        class="truncate text-xs text-neutral-500"
        :class="layout === 'tile' ? 'ml-auto' : 'shrink-0'"
      >
        {{ idea.platforms.map(platformLabel).join(" · ") }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { IdeaDoc, IdeaLabel } from "~/utils/boards";
import { IDEA_COLUMNS, platformLabel, statusIcon } from "~/utils/boards";
import { INLINE_TRIGGER } from "~/utils/ui";

const ROW_LABELS = 2;

const props = defineProps<{
  idea: IdeaDoc;
  labels: IdeaLabel[];
  layout: "tile" | "row";
}>();

const emit = defineEmits<{
  update: [changes: Partial<Pick<IdeaDoc, "status">>];
}>();

const statusOptions = IDEA_COLUMNS.map((c) => ({
  label: c.label,
  value: c.key,
}));
const column = computed(() =>
  IDEA_COLUMNS.find((c) => c.key === props.idea.status)
);

/** The labels the idea wears, in the labels' order; deleted ones drop out. */
const worn = computed(() => {
  const ids = new Set(props.idea.labelIds);
  return props.labels.filter((item) => ids.has(item._id));
});
</script>
