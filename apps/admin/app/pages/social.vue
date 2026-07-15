<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-light">Ideias</h1>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/c/ideaCategories"
          class="text-sm text-neutral-500 underline"
        >
          Gerir categorias
        </NuxtLink>
        <UiButton @click="openNew(IDEA_COLUMNS[0]?.key ?? 'draft')">
          Nova ideia
        </UiButton>
      </div>
    </div>

    <KanbanBoard
      :columns="IDEA_COLUMNS"
      :cards="ideas ?? []"
      @move="onMove"
      @add="openNew"
      @open="openEdit"
    >
      <template #card="{ card }">
        <div class="flex flex-col gap-2">
          <p class="font-medium">{{ card.title }}</p>
          <div class="flex flex-wrap items-center gap-1">
            <span
              v-if="categoryName(card.categoryId)"
              class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600"
            >
              {{ categoryName(card.categoryId) }}
            </span>
            <span
              v-for="platform in card.platforms"
              :key="platform"
              class="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500"
            >
              {{ platformLabel(platform) }}
            </span>
          </div>
        </div>
      </template>
    </KanbanBoard>

    <IdeaEditor
      v-if="editorOpen"
      :idea="editingIdea"
      :categories="categories ?? []"
      :default-status="editorStatus"
      :default-order="appendOrder(ideas ?? [], editorStatus)"
      @close="editorOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { CategoryDoc, IdeaDoc } from "~/utils/boards";
import { appendOrder, IDEA_COLUMNS, PLATFORMS } from "~/utils/boards";

const { data: ideas, refresh } = await useFetch<IdeaDoc[]>(
  "/api/data/socialMediaIdeas"
);
const { data: categories } = await useFetch<CategoryDoc[]>(
  "/api/data/ideaCategories"
);

const editorOpen = ref(false);
const editingIdea = ref<IdeaDoc | null>(null);
const editorStatus = ref(IDEA_COLUMNS[0]?.key ?? "draft");

function categoryName(categoryId?: string): string | undefined {
  if (!categoryId) {
    return undefined;
  }
  return categories.value?.find((c) => c._id === categoryId)?.name;
}

function platformLabel(key: string): string {
  return PLATFORMS.find((p) => p.key === key)?.label ?? key;
}

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

async function onSaved() {
  editorOpen.value = false;
  await refresh();
}

async function onMove(payload: { id: string; order: number; status: string }) {
  const idea = ideas.value?.find((i) => i._id === payload.id);
  if (!idea) {
    return;
  }
  // Optimistic: reflect the drop immediately, reconcile on failure.
  idea.order = payload.order;
  idea.status = payload.status;
  try {
    await $fetch("/api/data/socialMediaIdeas/move", {
      body: payload,
      method: "POST",
    });
  } catch {
    toast.error("Não foi possível mover a ideia.");
    await refresh();
  }
}
</script>
