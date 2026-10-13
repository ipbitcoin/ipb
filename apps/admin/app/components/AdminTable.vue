<template>
  <div class="overflow-x-auto rounded-2xl bg-white shadow-border">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-neutral-200/70">
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="h-10 px-3 text-xs font-medium whitespace-nowrap text-neutral-500"
            :class="{
              'text-right': isNumeric(column),
              'w-12 pr-0': column.kind === 'media',
            }"
            :aria-sort="ariaSort(column)"
          >
            <span v-if="column.kind === 'media'" class="sr-only">
              {{ column.label }}
            </span>
            <button
              v-else-if="sortable"
              type="button"
              class="group -mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 outline-none transition-colors duration-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand"
              :class="{
                'flex-row-reverse': isNumeric(column),
                'text-neutral-900': sort?.key === column.key,
              }"
              @click="toggleSort(column)"
            >
              {{ column.label }}
              <IconSortAsc
                v-if="sort?.key === column.key && sort.direction === 'asc'"
                class="size-3.5"
              />
              <IconSortDesc
                v-else-if="sort?.key === column.key"
                class="size-3.5"
              />
              <IconSort
                v-else
                class="size-3.5 opacity-0 transition-opacity duration-100 group-hover:opacity-60 group-focus-visible:opacity-60"
              />
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>

      <tbody v-if="pending">
        <tr
          v-for="n in skeletonRows"
          :key="n"
          class="border-b border-neutral-200/70 last:border-0"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="h-11 px-3"
            :class="{ 'pr-0': column.kind === 'media' }"
          >
            <div
              class="animate-pulse bg-neutral-100"
              :class="
                column.kind === 'media' ? 'size-8 rounded-md' : 'h-3.5 rounded'
              "
            />
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr
          v-for="row in shown"
          :key="row._id"
          class="border-b border-neutral-200/70 transition-colors duration-100 last:border-0"
          :class="
            clickable
              ? 'focus-ring cursor-pointer hover:bg-neutral-950/2.5 focus-visible:bg-neutral-950/2.5 focus-visible:-outline-offset-2'
              : ''
          "
          :tabindex="clickable ? 0 : undefined"
          :role="clickable ? 'link' : undefined"
          @click="clickable && emit('rowClick', row)"
          @keydown.enter.prevent="clickable && emit('rowClick', row)"
          @keydown.space.prevent="clickable && emit('rowClick', row)"
        >
          <td
            v-for="(column, index) in columns"
            :key="column.key"
            class="h-11 max-w-[24rem] truncate px-3 whitespace-nowrap"
            :class="{
              'text-right tabular-nums': isNumeric(column),
              'w-12 pr-0': column.kind === 'media',
              'font-medium text-neutral-900': index === primaryIndex,
              'text-neutral-600': index !== primaryIndex,
            }"
          >
            <slot
              name="cell"
              :row="row"
              :column="column"
              :value="getByPath(row, column.key)"
            >
              <AdminTableCell
                :column="column"
                :value="getByPath(row, column.key)"
              />
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!pending && !shown.length">
      <AdminEmptyState
        v-if="rows?.length"
        :title="`Nenhum resultado para “${search.trim()}”.`"
        description="Experimente outra pesquisa."
      />
      <slot v-else name="empty">
        <AdminEmptyState :title="emptyLabel" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { _id: string }">
import { matchesQuery } from "~/utils/search";
import type { TableColumn } from "~/utils/table";
import { cellText, compareCells, isNumeric } from "~/utils/table";

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: T[] | null | undefined;
    pending?: boolean;
    clickable?: boolean;
    emptyLabel?: string;
    skeletonRows?: number;
    /** Rows show only when a cell holds this text. */
    search?: string;
    /** Headers sort the rows when clicked. */
    sortable?: boolean;
  }>(),
  {
    clickable: false,
    emptyLabel: "Sem registos.",
    pending: false,
    search: "",
    skeletonRows: 5,
    sortable: true,
  }
);

const emit = defineEmits<{
  rowClick: [row: T];
}>();

const sort = ref<{ key: string; direction: "asc" | "desc" } | null>(null);

/** The column that names the row: the first that isn't a picture. */
const primaryIndex = computed(() =>
  props.columns.findIndex((column) => column.kind !== "media")
);

const shown = computed(() => {
  const rows = (props.rows ?? []).filter((row) =>
    matchesQuery(
      props.search,
      props.columns.map((column) =>
        cellText(column, getByPath(row, column.key))
      )
    )
  );
  const current = sort.value;
  if (!current) {
    return rows;
  }
  const sign = current.direction === "asc" ? 1 : -1;
  return rows.toSorted(
    (a, b) =>
      sign * compareCells(getByPath(a, current.key), getByPath(b, current.key))
  );
});

/** Ascending, then descending, then back to the order the rows came in. */
function toggleSort(column: TableColumn) {
  const current = sort.value;
  if (current?.key !== column.key) {
    sort.value = { direction: "asc", key: column.key };
  } else if (current.direction === "asc") {
    sort.value = { direction: "desc", key: column.key };
  } else {
    sort.value = null;
  }
}

function ariaSort(column: TableColumn) {
  if (sort.value?.key === column.key) {
    return sort.value.direction === "asc" ? "ascending" : "descending";
  }
}
</script>
