<template>
  <!-- The kanban fills the screen, so its columns scroll on their own and
       the page stays put. The list scrolls the page. -->
  <div
    class="flex flex-col gap-5"
    :class="layout === 'kanban' ? 'h-[calc(100dvh-4rem)] min-h-96' : ''"
  >
    <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 class="text-3xl font-light">Tarefas</h1>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <AdminSearch v-model="query" placeholder="Procurar tarefas…" />
        <BoardAssigneeFilter v-model="assigneeFilter" :admins="admins ?? []" />
        <BoardLayoutSwitch v-model="layout" />
        <UiButton size="sm" @click="openNew(TASK_COLUMNS[1]?.key ?? 'todo')">
          <IconPlus class="size-4" />
          Nova tarefa
        </UiButton>
      </div>
    </header>

    <BoardSkeleton v-if="!tasks" :layout="layout" />

    <BoardKanban
      v-else-if="layout === 'kanban'"
      :columns="TASK_COLUMNS"
      :cards="visible"
      quick-add-placeholder="Título da tarefa…"
      @move="onMove"
      @open="openEdit"
      @quick-add="quickAdd"
    >
      <template #card="{ card }">
        <TaskCard
          :task="card"
          :admins="admins ?? []"
          layout="tile"
          @update="(changes) => updateTask(card, changes)"
        />
      </template>
    </BoardKanban>

    <BoardList
      v-else
      storage-key="board:tasks"
      :columns="TASK_COLUMNS"
      :cards="visible"
      @add="openNew"
      @move="onMove"
      @open="openEdit"
    >
      <template #row="{ card }">
        <TaskCard
          :task="card"
          :admins="admins ?? []"
          layout="row"
          @update="(changes) => updateTask(card, changes)"
        />
      </template>
      <template #empty>
        <AdminEmptyState
          :title="filtered ? 'Nenhuma tarefa encontrada.' : 'Sem tarefas.'"
          :description="
            filtered ? 'Experimente outra pesquisa ou filtro.' : undefined
          "
        >
          <UiButton
            v-if="!filtered"
            size="sm"
            @click="openNew(TASK_COLUMNS[1]?.key ?? 'todo')"
          >
            Criar a primeira
          </UiButton>
        </AdminEmptyState>
      </template>
    </BoardList>

    <TaskEditor
      v-model:open="editorOpen"
      :task="editingTask"
      :admins="admins ?? []"
      :default-status="editorStatus"
      :default-assignee-id="assigneeFilter"
      :order-for="(status) => appendOrder(tasks ?? [], status)"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { AdminUser, BoardLayout, CardMove, TaskDoc } from "~/utils/boards";
import { appendOrder, isBoardLayout, TASK_COLUMNS } from "~/utils/boards";
import { matchesQuery } from "~/utils/search";

const { data: tasks, refresh } = useFetch<TaskDoc[]>("/api/data/tasks");
const { data: admins } = useFetch<AdminUser[]>("/api/admins");

const layout = useStoredRef<BoardLayout>(
  "board:tasks:layout",
  "kanban",
  isBoardLayout
);
const query = ref("");
const assigneeFilter = ref<string>();

const filtered = computed(
  () => query.value.trim() !== "" || Boolean(assigneeFilter.value)
);

const visible = computed(() =>
  (tasks.value ?? []).filter(
    (task) =>
      (!assigneeFilter.value || task.assigneeId === assigneeFilter.value) &&
      matchesQuery(query.value, [task.title, task.description])
  )
);

const editorOpen = ref(false);
const editingTask = ref<TaskDoc | null>(null);
const editorStatus = ref(TASK_COLUMNS[0]?.key ?? "backlog");

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

function payloadOf(task: TaskDoc) {
  return {
    assigneeId: task.assigneeId,
    description: task.description,
    dueDate: task.dueDate,
    order: task.order,
    status: task.status,
    title: task.title,
  };
}

async function quickAdd(status: string, title: string) {
  try {
    await $fetch("/api/data/tasks", {
      body: {
        assigneeId: assigneeFilter.value,
        order: appendOrder(tasks.value ?? [], status),
        status,
        title,
      },
      method: "POST",
    });
    await refresh();
  } catch (error: unknown) {
    toast.error(fetchErrorMessage(error) ?? "Não foi possível criar a tarefa.");
  }
}

/** Changes from a card's own controls: shown at once, undone if they fail. */
async function updateTask(
  task: TaskDoc,
  changes: Partial<Pick<TaskDoc, "assigneeId" | "dueDate" | "status">>
) {
  const next = { ...task, ...changes };
  if (changes.status && changes.status !== task.status) {
    // A card sent to another column joins its end.
    next.order = appendOrder(tasks.value ?? [], changes.status);
  }
  Object.assign(task, next);
  try {
    await $fetch(`/api/data/tasks/${task._id}`, {
      body: payloadOf(next),
      method: "PUT",
    });
  } catch {
    toast.error("Não foi possível atualizar a tarefa.");
    await refresh();
  }
}

async function onMove(moves: CardMove[]) {
  // Optimistic: reflect the drop immediately, reconcile on failure.
  for (const move of moves) {
    const task = tasks.value?.find((t) => t._id === move.id);
    if (task) {
      task.order = move.order;
      task.status = move.status;
    }
  }
  try {
    await Promise.all(
      moves.map((move) =>
        $fetch("/api/data/tasks/move", { body: move, method: "POST" })
      )
    );
  } catch {
    toast.error("Não foi possível mover a tarefa.");
    await refresh();
  }
}
</script>
