<template>
  <template v-if="column.kind === 'boolean'">
    <span
      v-if="value === true"
      class="inline-flex h-5 items-center gap-1.5 rounded-full bg-green-500/12 px-2 text-xs font-medium text-green-800"
    >
      <span class="size-1.5 rounded-full bg-green-500" />
      Sim
    </span>
    <span
      v-else
      class="inline-flex h-5 items-center gap-1.5 rounded-full bg-neutral-950/5 px-2 text-xs font-medium text-neutral-500"
    >
      <span class="size-1.5 rounded-full bg-neutral-400" />
      Não
    </span>
  </template>

  <span
    v-else-if="column.kind === 'badge' && value != null && value !== ''"
    class="inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs font-medium"
    :class="badge.pill"
  >
    <span class="size-1.5 rounded-full" :class="badge.dot" />
    {{ badge.label }}
  </span>

  <img
    v-else-if="column.kind === 'media' && typeof value === 'string' && value"
    :src="`https://${config.public.CDN_HOST}/${value}`"
    alt=""
    loading="lazy"
    class="size-8 rounded-md bg-neutral-50 object-contain outline -outline-offset-1 outline-black/10"
  />
  <span
    v-else-if="column.kind === 'media'"
    class="block size-8 rounded-md bg-neutral-100"
  />

  <template v-else-if="column.kind === 'money'">{{
    formatMoney(value)
  }}</template>
  <template v-else-if="column.kind === 'date'">{{
    formatDate(value)
  }}</template>
  <span v-else-if="value == null || value === ''" class="text-neutral-300"
    >—</span
  >
  <template v-else>{{ value }}</template>
</template>

<script setup lang="ts">
import type { TableColumn } from "~/utils/table";
import { badgeOf, formatDate, formatMoney } from "~/utils/table";

const props = defineProps<{
  column: TableColumn;
  value: unknown;
}>();

const config = useRuntimeConfig();

const badge = computed(() => badgeOf(props.value));
</script>
