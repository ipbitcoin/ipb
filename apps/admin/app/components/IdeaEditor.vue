<template>
  <AdminModal :open="true" @update:open="emit('close')">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <h2 class="text-xl font-light">
        {{ idea ? "Editar ideia" : "Nova ideia" }}
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
        <label class="text-sm font-medium">
          Descrição<span class="text-red-600">*</span>
        </label>
        <textarea
          v-model="form.description"
          rows="5"
          required
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
            v-for="column in IDEA_COLUMNS"
            :key="column.key"
            :value="column.key"
          >
            {{ column.label }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Categoria</label>
        <select
          v-model="form.categoryId"
          class="w-60 rounded border bg-white px-2 py-1.5"
        >
          <option value="">—</option>
          <option
            v-for="category in categories"
            :key="category._id"
            :value="category._id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Plataformas</label>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label
            v-for="platform in PLATFORMS"
            :key="platform.key"
            class="flex w-fit cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              class="size-4 accent-black"
              :checked="form.platforms.includes(platform.key)"
              @change="togglePlatform(platform.key)"
            />
            {{ platform.label }}
          </label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <UiButton type="submit" :loading="saving">Guardar</UiButton>
        <UiButton
          v-if="idea"
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

import type { CategoryDoc, IdeaDoc } from "~/utils/boards";
import { IDEA_COLUMNS, PLATFORMS } from "~/utils/boards";

const props = defineProps<{
  categories: CategoryDoc[];
  defaultOrder: number;
  defaultStatus: string;
  idea?: IdeaDoc | null;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const saving = ref(false);
const error = ref("");

const form = reactive({
  categoryId: props.idea?.categoryId ?? "",
  description: props.idea?.description ?? "",
  platforms: [...(props.idea?.platforms ?? [])],
  status: props.idea?.status ?? props.defaultStatus,
  title: props.idea?.title ?? "",
});

function togglePlatform(key: string) {
  form.platforms = form.platforms.includes(key)
    ? form.platforms.filter((p) => p !== key)
    : [...form.platforms, key];
}

async function save() {
  saving.value = true;
  error.value = "";
  const payload = {
    categoryId: form.categoryId || undefined,
    description: form.description,
    order: props.idea?.order ?? props.defaultOrder,
    platforms: form.platforms,
    status: form.status,
    title: form.title,
  };
  try {
    if (props.idea) {
      await $fetch(`/api/data/socialMediaIdeas/${props.idea._id}`, {
        body: payload,
        method: "PUT",
      });
    } else {
      await $fetch("/api/data/socialMediaIdeas", {
        body: payload,
        method: "POST",
      });
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
  if (!props.idea) {
    return;
  }
  if (!confirm("Apagar esta ideia? Esta ação é irreversível.")) {
    return;
  }
  await $fetch(`/api/data/socialMediaIdeas/${props.idea._id}`, {
    method: "DELETE",
  });
  toast.success("Apagado.");
  emit("saved");
}
</script>
