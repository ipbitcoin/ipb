<template>
  <AdminModal :open="true" @update:open="emit('close')">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <h2 class="text-xl font-light">
        {{ task ? "Editar tarefa" : "Nova tarefa" }}
      </h2>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">
          Título<span class="text-red-600">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          required
          class="rounded border bg-white px-2 py-1.5"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Descrição</label>
        <textarea
          v-model="form.description"
          rows="5"
          class="rounded border bg-white px-2 py-1.5"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Estado</label>
        <select
          v-model="form.status"
          class="w-60 rounded border bg-white px-2 py-1.5"
        >
          <option
            v-for="column in TASK_COLUMNS"
            :key="column.key"
            :value="column.key"
          >
            {{ column.label }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Responsável</label>
        <select
          v-model="form.assigneeId"
          class="w-60 rounded border bg-white px-2 py-1.5"
        >
          <option value="">Sem responsável</option>
          <option v-for="admin in admins" :key="admin._id" :value="admin._id">
            {{ adminLabel(admin) }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Data limite</label>
        <input
          v-model="form.dueDate"
          type="date"
          class="w-60 rounded border bg-white px-2 py-1.5"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <UiButton type="submit" :loading="saving">Guardar</UiButton>
        <UiButton
          v-if="task"
          type="button"
          variant="outline"
          class="!border-red-600 !text-red-600"
          @click="remove"
        >
          Apagar
        </UiButton>
        <button
          type="button"
          class="cursor-pointer text-sm text-neutral-500 underline"
          @click="emit('close')"
        >
          Cancelar
        </button>
      </div>
    </form>
  </AdminModal>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { AdminUser, TaskDoc } from "~/utils/boards";
import { adminLabel, TASK_COLUMNS } from "~/utils/boards";

const props = defineProps<{
  admins: AdminUser[];
  defaultOrder: number;
  defaultStatus: string;
  task?: TaskDoc | null;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const saving = ref(false);
const error = ref("");

const form = reactive({
  assigneeId: props.task?.assigneeId ?? "",
  description: props.task?.description ?? "",
  dueDate: props.task?.dueDate ?? "",
  status: props.task?.status ?? props.defaultStatus,
  title: props.task?.title ?? "",
});

async function save() {
  saving.value = true;
  error.value = "";
  const payload = {
    assigneeId: form.assigneeId || undefined,
    description: form.description || undefined,
    dueDate: form.dueDate || undefined,
    order: props.task?.order ?? props.defaultOrder,
    status: form.status,
    title: form.title,
  };
  try {
    if (props.task) {
      await $fetch(`/api/data/tasks/${props.task._id}`, {
        body: payload,
        method: "PUT",
      });
    } else {
      await $fetch("/api/data/tasks", { body: payload, method: "POST" });
    }
    toast.success("Guardado.");
    emit("saved");
  } catch (saveError: unknown) {
    error.value = fetchErrorMessage(saveError) ?? "Erro ao guardar.";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.task) {
    return;
  }
  if (!confirm("Apagar esta tarefa? Esta ação é irreversível.")) {
    return;
  }
  await $fetch(`/api/data/tasks/${props.task._id}`, { method: "DELETE" });
  toast.success("Apagado.");
  emit("saved");
}
</script>
