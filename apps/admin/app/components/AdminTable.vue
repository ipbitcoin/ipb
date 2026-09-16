<template>
  <div class="overflow-x-auto rounded-lg bg-white shadow-border">
    <table class="w-full text-left text-sm">
      <thead
        class="border-b border-neutral-200 bg-neutral-50 text-[11px] font-medium tracking-wider text-neutral-500 uppercase"
      >
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-3 py-2"
            :class="{ 'text-right': column.numeric }"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody v-if="pending">
        <tr
          v-for="n in skeletonRows"
          :key="n"
          class="border-b border-neutral-100 last:border-0"
        >
          <td v-for="column in columns" :key="column.key" class="px-3 py-2.5">
            <div class="h-3.5 animate-pulse rounded bg-neutral-100" />
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr
          v-for="row in rows ?? []"
          :key="row._id"
          class="border-b border-neutral-100 last:border-0"
          :class="
            clickable
              ? 'focus-ring cursor-pointer transition-colors duration-100 hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:-outline-offset-2'
              : ''
          "
          :tabindex="clickable ? 0 : undefined"
          :role="clickable ? 'link' : undefined"
          @click="clickable && emit('rowClick', row)"
          @keydown.enter.prevent="clickable && emit('rowClick', row)"
          @keydown.space.prevent="clickable && emit('rowClick', row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-3 py-2"
            :class="{ 'text-right tabular-nums': column.numeric }"
          >
            <slot
              name="cell"
              :row="row"
              :column="column"
              :value="getByPath(row, column.key)"
            >
              <IconCheck
                v-if="getByPath(row, column.key) === true"
                class="size-4 text-neutral-700"
                aria-label="Sim"
              />
              <span
                v-else-if="getByPath(row, column.key) === false"
                class="text-neutral-300"
                aria-label="Não"
                >—</span
              >
              <template v-else>
                {{ formatCell(getByPath(row, column.key)) }}
              </template>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!pending && !rows?.length">
      <slot name="empty">
        <AdminEmptyState :title="emptyLabel" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { _id: string }">
import type { TableColumn } from "~/utils/table";

withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: T[] | null | undefined;
    pending?: boolean;
    clickable?: boolean;
    emptyLabel?: string;
    skeletonRows?: number;
  }>(),
  {
    clickable: false,
    emptyLabel: "Sem registos.",
    pending: false,
    skeletonRows: 5,
  }
);

const emit = defineEmits<{
  rowClick: [row: T];
}>();

function formatCell(value: unknown): string {
  if (value == null) {
    return "";
  }
  return String(value);
}
</script>
