<template>
  <!-- The kanban fills the screen, so its columns scroll on their own and
       the page stays put. The list scrolls the page. -->
  <div
    class="flex flex-col gap-5"
    :class="layout === 'kanban' ? 'h-[calc(100dvh-4rem)] min-h-96' : ''"
  >
    <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 class="text-3xl font-light">Ideias</h1>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <AdminSearch v-model="query" placeholder="Procurar ideias…" />
        <BoardMenuMulti
          v-model="filters"
          label="Filtrar"
          align="end"
          :groups="filterGroups"
          empty-label="Sem etiquetas nem plataformas."
          :trigger-class="filters.length > 0 ? PILL_ACTIVE : PILL"
        >
          <template #trigger>
            <IconFilter class="size-3.5" />
            Filtrar
            <span v-if="filters.length > 0" class="tabular-nums">
              {{ filters.length }}
            </span>
          </template>
          <template #option="{ value }">
            <BoardLabelDot
              v-if="labelOf(value)"
              :color="labelOf(value)?.color ?? 'gray'"
            />
          </template>
        </BoardMenuMulti>
        <BoardLabelsManager
          :labels="labels ?? []"
          :usage="labelUsage"
          @update="updateLabel"
          @remove="removeLabel"
        />
        <BoardLayoutSwitch v-model="layout" />
        <UiButton size="sm" @click="openNew(IDEA_COLUMNS[0]?.key ?? 'draft')">
          <IconPlus class="size-4" />
          Nova ideia
        </UiButton>
      </div>
    </header>

    <BoardSkeleton v-if="!ideas" :layout="layout" />

    <BoardKanban
      v-else-if="layout === 'kanban'"
      :columns="IDEA_COLUMNS"
      :cards="visible"
      quick-add-placeholder="Título da ideia…"
      @move="onMove"
      @open="openEdit"
      @quick-add="quickAdd"
    >
      <template #card="{ card }">
        <IdeaCard
          :idea="card"
          :labels="labels ?? []"
          layout="tile"
          @update="(changes) => updateIdea(card, changes)"
        />
      </template>
    </BoardKanban>

    <BoardList
      v-else
      storage-key="board:ideas"
      :columns="IDEA_COLUMNS"
      :cards="visible"
      @add="openNew"
      @move="onMove"
      @open="openEdit"
    >
      <template #row="{ card }">
        <IdeaCard
          :idea="card"
          :labels="labels ?? []"
          layout="row"
          @update="(changes) => updateIdea(card, changes)"
        />
      </template>
      <template #empty>
        <AdminEmptyState
          :title="filtered ? 'Nenhuma ideia encontrada.' : 'Sem ideias.'"
          :description="
            filtered ? 'Experimente outra pesquisa ou filtro.' : undefined
          "
        >
          <UiButton
            v-if="!filtered"
            size="sm"
            @click="openNew(IDEA_COLUMNS[0]?.key ?? 'draft')"
          >
            Criar a primeira
          </UiButton>
        </AdminEmptyState>
      </template>
    </BoardList>

    <IdeaEditor
      v-model:open="editorOpen"
      :idea="editingIdea"
      :labels="labels ?? []"
      :create-label="createLabel"
      :default-status="editorStatus"
      :order-for="(status) => appendOrder(ideas ?? [], status)"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { BoardLayout, CardMove, IdeaDoc, IdeaLabel } from "~/utils/boards";
import {
  appendOrder,
  IDEA_COLUMNS,
  isBoardLayout,
  PLATFORMS,
  platformLabel,
} from "~/utils/boards";
import type { LabelColor } from "~/utils/palette";
import { nextLabelColor } from "~/utils/palette";
import { matchesQuery } from "~/utils/search";
import { PILL, PILL_ACTIVE } from "~/utils/ui";

const { data: ideas, refresh } = useFetch<IdeaDoc[]>(
  "/api/data/socialMediaIdeas"
);
const { data: labels, refresh: refreshLabels } = useFetch<IdeaLabel[]>(
  "/api/data/ideaLabels"
);

const { confirm } = useConfirm();

const layout = useStoredRef<BoardLayout>(
  "board:ideas:layout",
  "kanban",
  isBoardLayout
);
const query = ref("");
/** Picked filters, as "label:<id>" and "platform:<key>". */
const filters = ref<string[]>([]);

const filterGroups = computed(() => [
  {
    label: "Etiquetas",
    options: (labels.value ?? []).map((item) => ({
      label: item.name,
      value: `label:${item._id}`,
    })),
  },
  {
    label: "Plataformas",
    options: PLATFORMS.map((p) => ({
      label: p.label,
      value: `platform:${p.key}`,
    })),
  },
]);

function picked(prefix: string): string[] {
  return filters.value
    .filter((value) => value.startsWith(prefix))
    .map((value) => value.slice(prefix.length));
}

function labelOf(value: string | null): IdeaLabel | undefined {
  return value?.startsWith("label:")
    ? labels.value?.find((item) => `label:${item._id}` === value)
    : undefined;
}

const filtered = computed(
  () => query.value.trim() !== "" || filters.value.length > 0
);

// Any of the picked labels, and any of the picked platforms.
const visible = computed(() => {
  const labelIds = picked("label:");
  const platforms = picked("platform:");
  const names = new Map(
    (labels.value ?? []).map((item) => [item._id, item.name])
  );
  return (ideas.value ?? []).filter(
    (idea) =>
      (labelIds.length === 0 ||
        labelIds.some((id) => idea.labelIds?.includes(id))) &&
      (platforms.length === 0 ||
        platforms.some((key) => idea.platforms.includes(key))) &&
      matchesQuery(query.value, [
        idea.title,
        idea.description,
        ...(idea.labelIds ?? []).map((id) => names.get(id)),
        ...idea.platforms.map(platformLabel),
      ])
  );
});

const labelUsage = computed(() => {
  const counts = new Map<string, number>();
  for (const idea of ideas.value ?? []) {
    for (const id of idea.labelIds ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
});

const editorOpen = ref(false);
const editingIdea = ref<IdeaDoc | null>(null);
const editorStatus = ref(IDEA_COLUMNS[0]?.key ?? "draft");

function openNew(status: string) {
  editingIdea.value = null;
  editorStatus.value = status;
  editorOpen.value = true;
}

function openEdit(idea: IdeaDoc) {
  editingIdea.value = idea;
  editorStatus.value = idea.status;
  editorOpen.value = true;
}

function payloadOf(idea: IdeaDoc) {
  return {
    description: idea.description,
    labelIds: idea.labelIds ?? [],
    order: idea.order,
    platforms: idea.platforms,
    status: idea.status,
    title: idea.title,
  };
}

async function quickAdd(status: string, title: string) {
  try {
    await $fetch("/api/data/socialMediaIdeas", {
      body: {
        description: "",
        // Filtered to labels or platforms: the new idea wears them.
        labelIds: picked("label:"),
        order: appendOrder(ideas.value ?? [], status),
        platforms: picked("platform:"),
        status,
        title,
      },
      method: "POST",
    });
    await refresh();
  } catch (error: unknown) {
    toast.error(fetchErrorMessage(error) ?? "Não foi possível criar a ideia.");
  }
}

/** Changes from a card's own controls: shown at once, undone if they fail. */
async function updateIdea(
  idea: IdeaDoc,
  changes: Partial<Pick<IdeaDoc, "status">>
) {
  const next = { ...idea, ...changes };
  if (changes.status && changes.status !== idea.status) {
    // A card sent to another column joins its end.
    next.order = appendOrder(ideas.value ?? [], changes.status);
  }
  Object.assign(idea, next);
  try {
    await $fetch(`/api/data/socialMediaIdeas/${idea._id}`, {
      body: payloadOf(next),
      method: "PUT",
    });
  } catch {
    toast.error("Não foi possível atualizar a ideia.");
    await refresh();
  }
}

async function onMove(moves: CardMove[]) {
  // Optimistic: reflect the drop immediately, reconcile on failure.
  for (const move of moves) {
    const idea = ideas.value?.find((i) => i._id === move.id);
    if (idea) {
      idea.order = move.order;
      idea.status = move.status;
    }
  }
  try {
    await Promise.all(
      moves.map((move) =>
        $fetch("/api/data/socialMediaIdeas/move", {
          body: move,
          method: "POST",
        })
      )
    );
  } catch {
    toast.error("Não foi possível mover a ideia.");
    await refresh();
  }
}

async function createLabel(name: string): Promise<string | undefined> {
  try {
    const { id } = await $fetch<{ id: string }>("/api/data/ideaLabels", {
      body: { color: nextLabelColor(labels.value ?? []), name },
      method: "POST",
    });
    await refreshLabels();
    return id;
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível criar a etiqueta."
    );
    return undefined;
  }
}

async function updateLabel(
  label: IdeaLabel,
  changes: { name?: string; color?: LabelColor }
) {
  const next = { ...label, ...changes };
  Object.assign(label, next);
  try {
    await $fetch(`/api/data/ideaLabels/${label._id}`, {
      body: { color: next.color, name: next.name },
      method: "PUT",
    });
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível guardar a etiqueta."
    );
  }
  await refreshLabels();
}

async function removeLabel(label: IdeaLabel) {
  const uses = labelUsage.value.get(label._id) ?? 0;
  const confirmed = await confirm({
    confirmLabel: "Apagar",
    danger: true,
    description:
      uses > 0
        ? `Sai de ${uses === 1 ? "1 ideia" : `${uses} ideias`}. Esta ação é irreversível.`
        : "Esta ação é irreversível.",
    title: `Apagar a etiqueta “${label.name}”?`,
  });
  if (!confirmed) {
    return;
  }
  try {
    await $fetch(`/api/data/ideaLabels/${label._id}`, { method: "DELETE" });
    filters.value = filters.value.filter(
      (value) => value !== `label:${label._id}`
    );
    await Promise.all([refreshLabels(), refresh()]);
  } catch (error: unknown) {
    toast.error(
      fetchErrorMessage(error) ?? "Não foi possível apagar a etiqueta."
    );
  }
}
</script>
