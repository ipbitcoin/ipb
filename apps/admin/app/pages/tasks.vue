<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-light">Tarefas</h1>
      <UiButton @click="openNew(TASK_COLUMNS[0]?.key ?? 'backlog')">
        Nova tarefa
      </UiButton>
    </div>

    <KanbanBoard
      :columns="TASK_COLUMNS"
      :cards="tasks ?? []"
      @move="onMove"
      @add="openNew"
      @open="openEdit"
    >
      <template #card="{ card }">
        <div class="flex flex-col gap-2">
          <p class="font-medium">{{ card.title }}</p>
          <p
            v-if="card.description"
            class="line-clamp-2 text-xs text-neutral-500"
          >
            {{ card.description }}
          </p>
          <div class="flex items-center justify-between">
            <span
              v-if="card.dueDate"
              class="text-xs"
              :class="
                isOverdue(card)
                  ? 'font-medium text-red-600'
                  : 'text-neutral-500'
              "
            >
              {{ formatDueDate(card.dueDate) }}
            </span>
            <span v-else />
            <AdminAvatar
              v-if="assigneeOf(card)"
              :avatar-key="assigneeOf(card)?.avatarKey"
              :name="assigneeName(card)"
              size="sm"
            />
          </div>
        </div>
      </template>
    </KanbanBoard>

    <TaskEditor
      v-if="editorOpen"
      :task="editingTask"
      :admins="admins ?? []"
      :default-status="editorStatus"
      :default-order="appendOrder(tasks ?? [], editorStatus)"
      @close="editorOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { AdminUser, TaskDoc } from "~/utils/boards";
import { adminLabel, appendOrder, TASK_COLUMNS } from "~/utils/boards";

const { data: tasks, refresh } = await useFetch<TaskDoc[]>("/api/data/tasks");
const { data: admins } = await useFetch<AdminUser[]>("/api/admins");

const editorOpen = ref(false);
const editingTask = ref<TaskDoc | null>(null);
const editorStatus = ref(TASK_COLUMNS[0]?.key ?? "backlog");

function assigneeOf(task: TaskDoc): AdminUser | undefined {
  if (!task.assigneeId) {
    return undefined;
  }
  return admins.value?.find((a) => a._id === task.assigneeId);
}

function assigneeName(task: TaskDoc): string {
  const admin = assigneeOf(task);
  return admin ? adminLabel(admin) : "?";
}

function isOverdue(task: TaskDoc): boolean {
  if (!task.dueDate || task.status === "done") {
    return false;
  }
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

function formatDueDate(dueDate: string): string {
  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function openNew(status: string) {
  editingTask.value = null;
  editorStatus.value = status;
  editorOpen.value = true;
}

function openEdit(task: TaskDoc) {
  editingTask.value = task;
  editorStatus.value = task.status;
  editorOpen.value = true;
}

async function onSaved() {
  editorOpen.value = false;
  await refresh();
}

async function onMove(payload: { id: string; order: number; status: string }) {
  const task = tasks.value?.find((t) => t._id === payload.id);
  if (!task) {
    return;
  }
  task.order = payload.order;
  task.status = payload.status;
  try {
    await $fetch("/api/data/tasks/move", { body: payload, method: "POST" });
  } catch {
    toast.error("Não foi possível mover a tarefa.");
    await refresh();
  }
}
</script>
