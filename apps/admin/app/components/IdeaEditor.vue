<template>
  <AdminModal v-model:open="open" :title="idea ? 'Editar ideia' : 'Nova ideia'">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <AdminField label="Título" required html-for="idea-title">
        <input
          id="idea-title"
          v-model="form.title"
          type="text"
          required
          class="field-input"
        />
      </AdminField>

      <AdminField label="Descrição" required html-for="idea-description">
        <textarea
          id="idea-description"
          v-model="form.description"
          rows="5"
          required
          class="field-input"
        />
      </AdminField>

      <div class="grid gap-4 sm:grid-cols-2">
        <AdminField label="Estado" html-for="idea-status">
          <select id="idea-status" v-model="form.status" class="field-input">
            <option
              v-for="column in IDEA_COLUMNS"
              :key="column.key"
              :value="column.key"
            >
              {{ column.label }}
            </option>
          </select>
        </AdminField>

        <AdminField label="Categoria" html-for="idea-category">
          <select
            id="idea-category"
            v-model="form.categoryId"
            class="field-input"
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
        </AdminField>
      </div>

      <AdminField label="Plataformas">
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label
            v-for="platform in PLATFORMS"
            :key="platform.key"
            class="flex w-fit cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              class="size-4 accent-neutral-900"
              :checked="form.platforms.includes(platform.key)"
              @change="togglePlatform(platform.key)"
            />
            {{ platform.label }}
          </label>
        </div>
      </AdminField>

      <p
        v-if="error"
        class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <div class="flex items-center gap-3 pt-1">
        <UiButton type="submit" :loading="saving">Guardar</UiButton>
        <UiButton v-if="idea" type="button" variant="danger" @click="remove">
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

import type { CategoryDoc, IdeaDoc } from "~/utils/boards";
import { IDEA_COLUMNS, PLATFORMS } from "~/utils/boards";

const props = defineProps<{
  categories: CategoryDoc[];
  defaultOrder: number;
  defaultStatus: string;
  idea?: IdeaDoc | null;
}>();

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [] }>();

const { confirm } = useConfirm();

const saving = ref(false);
const error = ref("");

interface IdeaForm {
  categoryId: string;
  description: string;
  platforms: string[];
  status: string;
  title: string;
}

const form = reactive<IdeaForm>({
  categoryId: "",
  description: "",
  platforms: [],
  status: props.defaultStatus,
  title: "",
});

function resetForm() {
  form.categoryId = props.idea?.categoryId ?? "";
  form.description = props.idea?.description ?? "";
  form.platforms = [...(props.idea?.platforms ?? [])];
  form.status = props.idea?.status ?? props.defaultStatus;
  form.title = props.idea?.title ?? "";
  error.value = "";
}

// Stays mounted so the close animation can play; re-seed on every open.
watch(open, (isOpen) => isOpen && resetForm(), { immediate: true });

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
  const confirmed = await confirm({
    confirmLabel: "Apagar",
    danger: true,
    description: "Esta ação é irreversível.",
    title: "Apagar esta ideia?",
  });
  if (!confirmed) {
    return;
  }
  await $fetch(`/api/data/socialMediaIdeas/${props.idea._id}`, {
    method: "DELETE",
  });
  toast.success("Apagado.");
  emit("saved");
}
</script>
