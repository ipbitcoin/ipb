<template>
  <BoardCardDialog
    ref="dialog"
    v-model:open="open"
    v-model:title="form.title"
    v-model:description="form.description"
    v-model:create-more="createMore"
    board="Tarefas"
    :heading="task ? 'Editar tarefa' : 'Nova tarefa'"
    title-placeholder="Título da tarefa"
    submit-label="Criar tarefa"
    :editing="Boolean(task)"
    :saving="saving"
    :error="error"
    @submit="save"
    @remove="remove"
  >
    <template #properties>
      <BoardMenuSelect
        v-model="status"
        label="Estado"
        :options="statusOptions"
        :trigger-class="PILL"
      >
        <template #trigger>
          <BoardStatusIcon
            v-if="column"
            :icon="column.icon"
            class="size-3.5!"
          />
          {{ column?.label ?? "Estado" }}
        </template>
        <template #option="{ value }">
          <BoardStatusIcon
            v-if="value"
            :icon="statusIcon(TASK_COLUMNS, value)"
          />
        </template>
      </BoardMenuSelect>

      <BoardMenuSelect
        v-model="assigneeId"
        label="Responsável"
        :options="adminOptions"
        none-label="Sem responsável"
        :trigger-class="PILL"
      >
        <template #trigger>
          <template v-if="assignee">
            <AdminAvatar
              :avatar-key="assignee.avatarKey"
              :name="adminLabel(assignee)"
              size="xs"
              class="-ml-1"
            />
            <span class="truncate">{{ adminLabel(assignee) }}</span>
          </template>
          <span v-else class="flex items-center gap-1.5 text-neutral-500">
            <IconUser class="size-3.5" />
            Responsável
          </span>
        </template>
        <template #option="{ value }">
          <AdminAvatar
            v-if="adminById(value)"
            :avatar-key="adminById(value)?.avatarKey"
            :name="adminName(value)"
            size="xs"
          />
          <IconUser v-else class="size-4 text-neutral-400" />
        </template>
      </BoardMenuSelect>

      <BoardDatePopover
        v-model="form.dueDate"
        label="Data limite"
        :trigger-class="PILL"
      >
        <template #trigger>
          <span
            class="flex items-center gap-1.5"
            :class="form.dueDate ? '' : 'text-neutral-500'"
          >
            <IconCalendar class="size-3.5" />
            {{ form.dueDate ? formatDueDate(form.dueDate) : "Data limite" }}
          </span>
        </template>
      </BoardDatePopover>
    </template>
  </BoardCardDialog>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { AdminUser, TaskDoc } from "~/utils/boards";
import {
  adminLabel,
  formatDueDate,
  statusIcon,
  TASK_COLUMNS,
} from "~/utils/boards";
import { PILL } from "~/utils/ui";

const props = defineProps<{
  admins: AdminUser[];
  defaultStatus: string;
  /** Who a new task goes to, when the board is filtered to someone. */
  defaultAssigneeId?: string;
  /** The order that puts a card at the end of a column. */
  orderFor: (status: string) => number;
  task?: TaskDoc | null;
}>();

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [] }>();

const { confirm } = useConfirm();

const dialog = useTemplateRef("dialog");
const saving = ref(false);
const error = ref("");
const createMore = ref(false);

interface TaskForm {
  assigneeId: string;
  description: string;
  dueDate?: string;
  status: string;
  title: string;
}

const form = reactive<TaskForm>({
  assigneeId: "",
  description: "",
  status: props.defaultStatus,
  title: "",
});

// The menus speak in `null` for "nothing"; the form keeps empty strings.
const status = computed({
  get: () => form.status,
  set: (value: string | null) => {
    form.status = value ?? form.status;
  },
});
const assigneeId = computed({
  get: () => form.assigneeId || null,
  set: (value: string | null) => {
    form.assigneeId = value ?? "";
  },
});

const statusOptions = TASK_COLUMNS.map((c) => ({
  label: c.label,
  value: c.key,
}));
function adminById(id: string | null): AdminUser | undefined {
  return id ? props.admins.find((a) => a._id === id) : undefined;
}

function adminName(id: string | null): string {
  const admin = adminById(id);
  return admin ? adminLabel(admin) : "?";
}

const adminOptions = computed(() =>
  props.admins.map((a) => ({ label: adminLabel(a), value: a._id }))
);
const column = computed(() => TASK_COLUMNS.find((c) => c.key === form.status));
const assignee = computed(() => adminById(form.assigneeId));

function resetForm() {
  form.assigneeId = props.task?.assigneeId ?? props.defaultAssigneeId ?? "";
  form.description = props.task?.description ?? "";
  form.dueDate = props.task?.dueDate;
  form.status = props.task?.status ?? props.defaultStatus;
  form.title = props.task?.title ?? "";
  error.value = "";
}

// Stays mounted so the close animation can play; re-seed on every open.
watch(open, (isOpen) => isOpen && resetForm(), { immediate: true });

function orderOnSave(): number {
  const { task } = props;
  // Moved to another column from here: it joins the end of that one.
  return task && task.status === form.status
    ? task.order
    : props.orderFor(form.status);
}

async function save() {
  saving.value = true;
  error.value = "";
  const payload = {
    assigneeId: form.assigneeId || undefined,
    description: form.description.trim() || undefined,
    dueDate: form.dueDate || undefined,
    order: orderOnSave(),
    status: form.status,
    title: form.title.trim(),
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
    emit("saved");
    if (!props.task && createMore.value) {
      // Properties carry over, so a run of similar tasks is quick to enter.
      toast.success("Tarefa criada.");
      form.title = "";
      form.description = "";
      dialog.value?.focusTitle();
    } else {
      open.value = false;
    }
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
  toast.success("Tarefa apagada.");
  open.value = false;
  emit("saved");
}
</script>
