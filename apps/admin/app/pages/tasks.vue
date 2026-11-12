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
        <BoardMenuMulti
          v-model="categoryFilter"
          label="Filtrar por categoria"
          align="end"
          :groups="filterGroups"
          empty-label="Ainda sem categorias."
          :trigger-class="categoryFilter.length > 0 ? PILL_ACTIVE : PILL"
        >
          <template #trigger>
            <IconFilter class="size-3.5" />
            Categorias
            <span v-if="categoryFilter.length > 0" class="tabular-nums">
              {{ categoryFilter.length }}
            </span>
          </template>
          <template #option="{ value }">
            <BoardLabelDot
              v-if="categoryById(value)"
              :color="categoryById(value)?.color ?? 'gray'"
            />
          </template>
        </BoardMenuMulti>
        <BoardLabelsManager
          :labels="categories ?? []"
          :words="TASK_CATEGORY_WORDS"
          :usage="categoryUsage"
          @update="updateCategory"
          @remove="removeCategory"
        />
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
          :categories="categories ?? []"
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
          :categories="categories ?? []"
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
      :categories="categories ?? []"
      :create-category="createCategory"
      :default-status="editorStatus"
      :default-assignee-id="assigneeFilter"
      :default-category-ids="categoryFilter"
      :order-for="(status) => appendOrder(tasks ?? [], status)"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type {
  AdminUser,
  BoardLabel,
  BoardLayout,
  CardMove,
  TaskDoc,
} from "~/utils/boards";
import {
  appendOrder,
  countOf,
  isBoardLayout,
  TASK_CATEGORY_WORDS,
  TASK_COLUMNS,
} from "~/utils/boards";
import type { LabelColor } from "~/utils/palette";
import { nextLabelColor } from "~/utils/palette";
import { matchesQuery } from "~/utils/search";
import { PILL, PILL_ACTIVE } from "~/utils/ui";

const { data: tasks, refresh } = useFetch<TaskDoc[]>("/api/data/tasks");
const { data: admins } = useFetch<AdminUser[]>("/api/admins");
const { data: categories, refresh: refreshCategories } = useFetch<BoardLabel[]>(
  "/api/data/taskCategories"
);

const { confirm } = useConfirm();

const layout = useStoredRef<BoardLayout>(
  "board:tasks:layout",
  "kanban",
  isBoardLayout
);
const query = ref("");
const assigneeFilter = ref<string>();
/** Ids of the categories picked to filter by. */
const categoryFilter = ref<string[]>([]);

const filterGroups = computed(() => [
  {
    options: (categories.value ?? []).map((item) => ({
      label: item.name,
      value: item._id,
    })),
  },
]);

function categoryById(id: string | null): BoardLabel | undefined {
  return id ? categories.value?.find((item) => item._id === id) : undefined;
}

const filtered = computed(
  () =>
    query.value.trim() !== "" ||
    Boolean(assigneeFilter.value) ||
    categoryFilter.value.length > 0
);

// Any of the picked categories.
const visible = computed(() => {
  const names = new Map(
    (categories.value ?? []).map((item) => [item._id, item.name])
  );
  return (tasks.value ?? []).filter(
    (task) =>
      (!assigneeFilter.value || task.assigneeId === assigneeFilter.value) &&
      (categoryFilter.value.length === 0 ||
        categoryFilter.value.some((id) => task.categoryIds?.includes(id))) &&
      matchesQuery(query.value, [
        task.title,
        task.description,
        ...(task.categoryIds ?? []).map((id) => names.get(id)),
      ])
  );
});

const categoryUsage = computed(() => {
  const counts = new Map<string, number>();
  for (const task of tasks.value ?? []) {
    for (const id of task.categoryIds ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
});

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
    categoryIds: task.categoryIds ?? [],
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
        // Filtered to categories: the new task is in them.
        categoryIds: categoryFilter.value,
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

async function createCategory(name: string): Promise<string | undefined> {
  try {
    const { id } = await $fetch<{ id: string }>("/api/data/taskCategories", {
      body: { color: nextLabelColor(categories.value ?? []), name },
      method: "POST",
    });
    await refreshCategories();
    return id;
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível criar a categoria."
    );
    return undefined;
  }
}

async function updateCategory(
  category: BoardLabel,
  changes: { name?: string; color?: LabelColor }
) {
  const next = { ...category, ...changes };
  Object.assign(category, next);
  try {
    await $fetch(`/api/data/taskCategories/${category._id}`, {
      body: { color: next.color, name: next.name },
      method: "PUT",
    });
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível guardar a categoria."
    );
  }
  await refreshCategories();
}

async function removeCategory(category: BoardLabel) {
  const uses = categoryUsage.value.get(category._id) ?? 0;
  const confirmed = await confirm({
    confirmLabel: "Apagar",
    danger: true,
    description:
      uses > 0
        ? `Sai de ${countOf(uses, TASK_CATEGORY_WORDS.card)}. Esta ação é irreversível.`
        : "Esta ação é irreversível.",
    title: `Apagar a categoria “${category.name}”?`,
  });
  if (!confirmed) {
    return;
  }
  try {
    await $fetch(`/api/data/taskCategories/${category._id}`, {
      method: "DELETE",
    });
    categoryFilter.value = categoryFilter.value.filter(
      (id) => id !== category._id
    );
    await Promise.all([refreshCategories(), refresh()]);
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível apagar a categoria."
    );
  }
}
</script>
