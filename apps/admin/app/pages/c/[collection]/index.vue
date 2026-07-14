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

    <div class="overflow-x-auto rounded border bg-white">
      <table class="w-full text-left text-sm">
        <thead
          class="border-b bg-neutral-50 uppercase tracking-wider text-neutral-500"
        >
          <tr>
            <th
              v-for="field in def.listFields"
              :key="field.key"
              class="px-3 py-2"
            >
              {{ field.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in records"
            :key="record._id"
            class="border-b last:border-0"
            :class="{ 'cursor-pointer hover:bg-neutral-50': !def.readOnly }"
            @click="
              !def.readOnly && navigateTo(`/c/${collection}/${record._id}`)
            "
          >
            <td
              v-for="field in def.listFields"
              :key="field.key"
              class="px-3 py-2"
            >
              {{ formatCell(getByPath(record, field.key)) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!records?.length" class="p-4 text-sm text-neutral-500">
        Sem registos.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const collection = String(route.params.collection);
const def = COLLECTIONS[collection];

if (!def) {
  throw createError({ message: "Coleção desconhecida", statusCode: 404 });
}

const { data: records } = useFetch<Record<string, unknown>[]>(
  `/api/data/${collection}`
);

function formatCell(value: unknown): string {
  if (value === true) {
    return "✓";
  }
  if (value === false || value == null) {
    return value === false ? "—" : "";
  }
  return String(value);
}

function exportCsv() {
  if (!records.value?.length) {
    return;
  }
  const keys = Object.keys(records.value[0] ?? {});
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll(/"/g, '""')}"`;
  const rows = [
    keys.join(","),
    ...records.value.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${collection}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>
