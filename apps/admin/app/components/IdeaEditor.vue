<template>
  <BoardCardDialog
    ref="dialog"
    v-model:open="open"
    v-model:title="form.title"
    v-model:description="form.description"
    v-model:create-more="createMore"
    board="Ideias"
    :heading="idea ? 'Editar ideia' : 'Nova ideia'"
    title-placeholder="Título da ideia"
    submit-label="Criar ideia"
    :editing="Boolean(idea)"
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
            :icon="statusIcon(IDEA_COLUMNS, value)"
          />
        </template>
      </BoardMenuSelect>

      <BoardLabelPicker
        v-model="form.labelIds"
        label="Etiquetas"
        :labels="labels"
        :create-label="createLabel"
        :trigger-class="PILL"
      >
        <template #trigger>
          <template v-if="picked.length > 0">
            <span class="flex -space-x-0.5">
              <BoardLabelDot
                v-for="item in picked"
                :key="item._id"
                :color="item.color"
                class="ring-2 ring-[color-mix(in_oklab,var(--color-neutral-950)_5%,white)]"
              />
            </span>
            <span class="truncate">
              {{ picked.map((item) => item.name).join(", ") }}
            </span>
          </template>
          <span v-else class="flex items-center gap-1.5 text-neutral-500">
            <IconTag class="size-3.5" />
            Etiquetas
          </span>
        </template>
      </BoardLabelPicker>

      <BoardMenuMulti
        v-model="form.platforms"
        label="Plataformas"
        :groups="[{ options: platformOptions }]"
        :trigger-class="PILL"
      >
        <template #trigger>
          <span
            class="flex items-center gap-1.5"
            :class="form.platforms.length > 0 ? '' : 'text-neutral-500'"
          >
            <IconShare class="size-3.5" />
            <span class="truncate">
              {{
                form.platforms.length > 0
                  ? form.platforms.map(platformLabel).join(", ")
                  : "Plataformas"
              }}
            </span>
          </span>
        </template>
      </BoardMenuMulti>
    </template>
  </BoardCardDialog>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { IdeaDoc, IdeaLabel } from "~/utils/boards";
import {
  IDEA_COLUMNS,
  PLATFORMS,
  platformLabel,
  statusIcon,
} from "~/utils/boards";
import { PILL } from "~/utils/ui";

const props = defineProps<{
  labels: IdeaLabel[];
  createLabel: (name: string) => Promise<string | undefined>;
  defaultStatus: string;
  /** The order that puts a card at the end of a column. */
  orderFor: (status: string) => number;
  idea?: IdeaDoc | null;
}>();

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [] }>();

const { confirm } = useConfirm();

const dialog = useTemplateRef("dialog");
const saving = ref(false);
const error = ref("");
const createMore = ref(false);

interface IdeaForm {
  description: string;
  labelIds: string[];
  platforms: string[];
  status: string;
  title: string;
}

const form = reactive<IdeaForm>({
  description: "",
  labelIds: [],
  platforms: [],
  status: props.defaultStatus,
  title: "",
});

const status = computed({
  get: () => form.status,
  set: (value: string | null) => {
    form.status = value ?? form.status;
  },
});

const statusOptions = IDEA_COLUMNS.map((c) => ({
  label: c.label,
  value: c.key,
}));
const platformOptions = PLATFORMS.map((p) => ({
  label: p.label,
  value: p.key,
}));
const column = computed(() => IDEA_COLUMNS.find((c) => c.key === form.status));
const picked = computed(() =>
  props.labels.filter((item) => form.labelIds.includes(item._id))
);

function resetForm() {
  form.description = props.idea?.description ?? "";
  form.labelIds = [...(props.idea?.labelIds ?? [])];
  form.platforms = [...(props.idea?.platforms ?? [])];
  form.status = props.idea?.status ?? props.defaultStatus;
  form.title = props.idea?.title ?? "";
  error.value = "";
}

// Stays mounted so the close animation can play; re-seed on every open.
watch(open, (isOpen) => isOpen && resetForm(), { immediate: true });

function orderOnSave(): number {
  const { idea } = props;
  // Moved to another column from here: it joins the end of that one.
  return idea && idea.status === form.status
    ? idea.order
    : props.orderFor(form.status);
}

async function save() {
  saving.value = true;
  error.value = "";
  const known = new Set(props.labels.map((item) => item._id));
  const payload = {
    description: form.description.trim(),
    // A label deleted meanwhile drops out rather than failing the save.
    labelIds: form.labelIds.filter((id) => known.has(id)),
    order: orderOnSave(),
    platforms: form.platforms,
    status: form.status,
    title: form.title.trim(),
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
    emit("saved");
    if (!props.idea && createMore.value) {
      // Properties carry over, so a run of similar ideas is quick to enter.
      toast.success("Ideia criada.");
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
  toast.success("Ideia apagada.");
  open.value = false;
  emit("saved");
}
</script>
