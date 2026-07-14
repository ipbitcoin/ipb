<template>
  <div v-if="def && !def.readOnly" class="flex flex-col gap-6">
    <h1 class="text-3xl font-light">{{ def.label }} — novo</h1>
    <AdminRecordForm :collection="collection" :def="def" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const collection = String(route.params.collection);
const def = COLLECTIONS[collection];

if (!def || def.readOnly) {
  throw createError({ message: "Coleção desconhecida", statusCode: 404 });
}
</script>
