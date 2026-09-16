<template>
  <div v-if="def" class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-light">{{ def.label }}</h1>
      <div class="flex gap-2">
        <UiButton v-if="def.readOnly" variant="outline" @click="exportCsv"
          >Exportar CSV</UiButton
        >
        <UiButton v-else :to="`/c/${collection}/new`">Novo</UiButton>
      </div>
    </div>

    <AdminTable
      :columns="def.listFields"
      :rows="records"
      :pending="status === 'pending'"
      :clickable="!def.readOnly"
      @row-click="(record) => navigateTo(`/c/${collection}/${record._id}`)"
    >
      <template #empty>
        <AdminEmptyState
          title="Sem registos."
          :description="
            def.readOnly
              ? undefined
              : `Ainda não existe nenhum registo em ${def.label}.`
          "
        >
          <UiButton v-if="!def.readOnly" :to="`/c/${collection}/new`">
            Criar o primeiro
          </UiButton>
        </AdminEmptyState>
      </template>
    </AdminTable>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const collection = String(route.params.collection);
const def = COLLECTIONS[collection];

if (!def) {
  throw createError({ message: "Coleção desconhecida", statusCode: 404 });
}

const { data: records, status } = useFetch<{ _id: string }[]>(
  `/api/data/${collection}`
);

function exportCsv() {
  if (!records.value?.length) {
    return;
  }
  const keys = Object.keys(records.value[0] ?? {});
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll(/"/g, '""')}"`;
  const rows = [
    keys.join(","),
    ...records.value.map((r) =>
      keys.map((k) => escape(getByPath(r, k))).join(",")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${collection}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>
