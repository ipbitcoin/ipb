<template>
  <AdminModal
    v-model:open="open"
    :title="task ? 'Editar tarefa' : 'Nova tarefa'"
  >
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <AdminField label="Título" required html-for="task-title">
        <input
          id="task-title"
          v-model="form.title"
          type="text"
          required
          class="field-input"
        />
      </AdminField>

      <AdminField label="Descrição" html-for="task-description">
        <textarea
          id="task-description"
          v-model="form.description"
          rows="5"
          class="field-input"
        />
      </AdminField>

      <div class="grid gap-4 sm:grid-cols-2">
        <AdminField label="Estado" html-for="task-status">
          <select id="task-status" v-model="form.status" class="field-input">
            <option
              v-for="column in TASK_COLUMNS"
              :key="column.key"
              :value="column.key"
            >
              {{ column.label }}
            </option>
          </select>
        </AdminField>

        <AdminField label="Responsável" html-for="task-assignee">
          <select
            id="task-assignee"
            v-model="form.assigneeId"
            class="field-input"
          >
            <option value="">Sem responsável</option>
            <option v-for="admin in admins" :key="admin._id" :value="admin._id">
              {{ adminLabel(admin) }}
            </option>
          </select>
        </AdminField>

        <AdminField label="Data limite" html-for="task-due">
          <input
            id="task-due"
            v-model="form.dueDate"
            type="date"
            class="field-input"
          />
        </AdminField>
      </div>

      <p
        v-if="error"
        class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <div class="flex items-center gap-3 pt-1">
        <UiButton type="submit" :loading="saving">Guardar</UiButton>
        <UiButton v-if="task" type="button" variant="danger" @click="remove">
          Apagar
        </UiButton>
        <button
          type="button"
          class="focus-ring ml-auto cursor-pointer rounded text-sm text-neutral-500 transition-colors duration-100 hover:text-neutral-900"
          @click="open = false"
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

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [] }>();

const { confirm } = useConfirm();

const saving = ref(false);
const error = ref("");

const form = reactive({
  assigneeId: "",
  description: "",
  dueDate: "",
  status: props.defaultStatus,
  title: "",
});

function resetForm() {
  form.assigneeId = props.task?.assigneeId ?? "";
  form.description = props.task?.description ?? "";
  form.dueDate = props.task?.dueDate ?? "";
  form.status = props.task?.status ?? props.defaultStatus;
  form.title = props.task?.title ?? "";
  error.value = "";
}

// Stays mounted so the close animation can play; re-seed on every open.
watch(open, (isOpen) => isOpen && resetForm(), { immediate: true });

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
  const confirmed = await confirm({
    confirmLabel: "Apagar",
    danger: true,
    description: "Esta ação é irreversível.",
    title: "Apagar esta tarefa?",
  });
  if (!confirmed) {
    return;
  }
  await $fetch(`/api/data/tasks/${props.task._id}`, { method: "DELETE" });
  toast.success("Apagado.");
  emit("saved");
}
</script>
