<template>
  <div v-if="def && record" class="flex flex-col gap-6">
    <h1 class="text-3xl font-light">{{ def.label }} — editar</h1>
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

const { data: record } = await useFetch<Record<string, unknown>>(
  `/api/data/${collection}/${recordId}`
);
</script>
