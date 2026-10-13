<template>
  <div v-if="def && record" class="flex flex-col gap-6">
    <h1 class="text-3xl font-light">{{ def.label }} — editar</h1>
    <!-- Records made elsewhere: what they hold, beside the fields edited here. -->
    <dl
      v-if="def.editOnly"
      class="grid max-w-3xl grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-white p-6 shadow-border sm:grid-cols-3"
    >
      <div
        v-for="column in summaryColumns"
        :key="column.key"
        class="flex min-w-0 flex-col gap-1"
      >
        <dt class="text-xs font-medium text-neutral-500">{{ column.label }}</dt>
        <dd class="truncate text-sm text-neutral-900">
          <AdminTableCell
            :column="column"
            :value="getByPath(record, column.key)"
          />
        </dd>
      </div>
    </dl>
    <AdminRecordForm
      :collection="collection"
      :def="def"
      :record-id="recordId"
      :initial="record"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const collection = String(route.params.collection);
const recordId = String(route.params.id);
const def = COLLECTIONS[collection];

if (!def || def.readOnly) {
  throw createError({ message: "Coleção desconhecida", statusCode: 404 });
}

const editedKeys = new Set(def.fields.map((field) => field.key));
const summaryColumns = def.listFields.filter(
  (column) => !editedKeys.has(column.key)
);

const { data: record } = await useFetch<Record<string, unknown>>(
  `/api/data/${collection}/${recordId}`
);
</script>
