<template>
  <div v-if="def" class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 class="flex items-baseline gap-3 text-3xl font-light">
        {{ def.label }}
        <span v-if="records" class="text-base text-neutral-400 tabular-nums">
          {{ records.length }}
        </span>
      </h1>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <AdminSearch
          v-model="search"
          :placeholder="`Procurar em ${def.label}…`"
        />
        <UiButton
          v-if="!creatable"
          size="sm"
          variant="outline"
          @click="exportCsv"
        >
          Exportar CSV
        </UiButton>
        <UiButton v-else size="sm" :to="`/c/${collection}/new`">
          <IconPlus class="size-4" />
          Novo
        </UiButton>
      </div>
    </header>

    <AdminTable
      :columns="def.listFields"
      :rows="records"
      :search="search"
      :pending="status === 'pending'"
      :clickable="!def.readOnly"
      @row-click="(record) => navigateTo(`/c/${collection}/${record._id}`)"
    >
      <template #empty>
        <AdminEmptyState
          title="Sem registos."
          :description="
            creatable
              ? `Ainda não existe nenhum registo em ${def.label}.`
              : undefined
          "
        >
          <UiButton v-if="creatable" size="sm" :to="`/c/${collection}/new`">
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

const creatable = !def.readOnly && !def.editOnly;

const { data: records, status } = useFetch<{ _id: string }[]>(
  `/api/data/${collection}`
);

const search = ref("");

function exportCsv() {
  if (!records.value?.length) {
    return;
  }
  // Every key any record has: optional fields are missing from some.
  const keys = [...new Set(records.value.flatMap((r) => Object.keys(r)))];
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
