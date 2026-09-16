<template>
  <form
    class="flex max-w-3xl flex-col gap-6 rounded-lg bg-white p-6 shadow-border"
    @submit.prevent="save"
  >
    <AdminField
      v-for="field in def.fields"
      :key="field.key"
      :label="field.label"
      :required="field.required"
      :hint="field.hint"
      :html-for="isScalar(field.type) ? `field-${field.key}` : undefined"
    >
      <!-- plain scalar fields -->
      <input
        v-if="field.type === 'text' || field.type === 'datetime'"
        :id="`field-${field.key}`"
        v-model="model[field.key]"
        type="text"
        :required="field.required"
        class="field-input"
      />
      <textarea
        v-else-if="field.type === 'textarea'"
        :id="`field-${field.key}`"
        v-model="model[field.key]"
        rows="4"
        :required="field.required"
        class="field-input"
      />
      <input
        v-else-if="field.type === 'number'"
        :id="`field-${field.key}`"
        v-model.number="model[field.key]"
        type="number"
        :required="field.required"
        class="field-input w-40 tabular-nums"
      />
      <label
        v-else-if="field.type === 'boolean'"
        class="flex w-fit cursor-pointer items-center gap-2 py-1"
      >
        <input
          v-model="model[field.key]"
          type="checkbox"
          class="size-4 accent-neutral-900"
        />
        <span class="text-sm text-neutral-600">{{
          model[field.key] ? "Sim" : "Não"
        }}</span>
      </label>
      <select
        v-else-if="field.type === 'select'"
        :id="`field-${field.key}`"
        v-model="model[field.key]"
        :required="field.required"
        class="field-input w-60"
      >
        <option v-for="option in field.options" :key="option" :value="option">
          {{ option }}
        </option>
      </select>

      <!-- localized string pair -->
      <div
        v-else-if="
          field.type === 'locText' ||
          field.type === 'locTextarea' ||
          field.type === 'locMarkdown'
        "
        class="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <div
          v-for="lang in ['pt', 'en'] as const"
          :key="lang"
          class="flex flex-col gap-1.5"
        >
          <span
            class="text-[11px] font-medium tracking-wider text-neutral-400 uppercase"
            >{{ lang }}</span
          >
          <input
            v-if="field.type === 'locText'"
            v-model="model[field.key][lang]"
            type="text"
            :required="field.required"
            class="field-input"
            :aria-label="`${field.label} (${lang})`"
          />
          <textarea
            v-else
            v-model="model[field.key][lang]"
            :rows="field.type === 'locMarkdown' ? 16 : 4"
            :required="field.required"
            class="field-input font-mono"
            :aria-label="`${field.label} (${lang})`"
          />
          <details v-if="field.type === 'locMarkdown'" class="text-sm">
            <summary
              class="focus-ring w-fit cursor-pointer rounded text-neutral-500 transition-colors duration-100 hover:text-neutral-900"
            >
              Pré-visualizar
            </summary>
            <MDC
              :value="model[field.key][lang] || ''"
              class="prose mt-2 max-w-none rounded-lg bg-white p-4 shadow-border"
            />
          </details>
        </div>
      </div>

      <!-- media -->
      <AdminMediaUpload
        v-else-if="field.type === 'media'"
        v-model="model[field.key]"
        :accept="field.accept"
      />
      <div
        v-else-if="field.type === 'locMedia'"
        class="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <div
          v-for="lang in ['pt', 'en'] as const"
          :key="lang"
          class="flex flex-col gap-1.5"
        >
          <span
            class="text-[11px] font-medium tracking-wider text-neutral-400 uppercase"
            >{{ lang }}</span
          >
          <AdminMediaUpload
            v-model="model[field.key][lang]"
            :accept="field.accept"
          />
        </div>
      </div>

      <!-- relations -->
      <select
        v-else-if="field.type === 'relation'"
        :id="`field-${field.key}`"
        v-model="model[field.key]"
        class="field-input w-72"
      >
        <option :value="undefined">—</option>
        <option
          v-for="option in relationOptions[field.key]"
          :key="option.id"
          :value="option.id"
        >
          {{ option.label }}
        </option>
      </select>
      <div
        v-else-if="field.type === 'multiRelation'"
        class="flex flex-col gap-1"
      >
        <label
          v-for="option in relationOptions[field.key]"
          :key="option.id"
          class="flex w-fit cursor-pointer items-center gap-2 py-0.5 text-sm"
        >
          <input
            type="checkbox"
            class="size-4 accent-neutral-900"
            :checked="model[field.key].includes(option.id)"
            @change="toggleMulti(field.key, option.id)"
          />
          {{ option.label }}
        </label>
      </div>
    </AdminField>

    <p v-if="error" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ error }}
    </p>

    <div class="flex items-center gap-3 border-t border-neutral-100 pt-5">
      <UiButton type="submit" :loading="saving">Guardar</UiButton>
      <UiButton v-if="recordId" type="button" variant="danger" @click="remove">
        Apagar
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import type { CollectionDef, FieldType } from "~/utils/collections";

const props = defineProps<{
  collection: string;
  def: CollectionDef;
  recordId?: string;
  initial?: Record<string, unknown>;
}>();

const { confirm } = useConfirm();

const saving = ref(false);
const error = ref("");

/** Field types rendered as a single control that can take an id / label. */
function isScalar(type: FieldType): boolean {
  return (
    type === "text" ||
    type === "datetime" ||
    type === "textarea" ||
    type === "number" ||
    type === "select" ||
    type === "relation"
  );
}

// ── Build the reactive model from field defs + existing record ─────────────
function emptyValue(type: string): unknown {
  if (
    type === "locText" ||
    type === "locTextarea" ||
    type === "locMarkdown" ||
    type === "locMedia"
  ) {
    return { en: "", pt: "" };
  }
  if (type === "multiRelation") {
    return [];
  }
  if (type === "boolean") {
    return false;
  }
  if (type === "number") {
    return 0;
  }
  return "";
}

// Model values span every field shape (strings, locale pairs, arrays, …)
// oxlint-disable-next-line typescript/no-explicit-any
const model = reactive<Record<string, any>>({});
for (const field of props.def.fields) {
  const existing = props.initial?.[field.key];
  if (existing !== null && typeof existing === "object") {
    model[field.key] = { ...existing };
  } else if (existing !== undefined) {
    model[field.key] = existing;
  } else {
    model[field.key] = emptyValue(field.type);
  }
}

// ── Relation options ────────────────────────────────────────────────────────
const relationOptions = reactive<
  Record<string, { id: string; label: string }[]>
>({});
for (const field of props.def.fields) {
  if (
    (field.type === "relation" || field.type === "multiRelation") &&
    field.relationTo
  ) {
    relationOptions[field.key] = [];
    $fetch<Record<string, unknown>[]>(`/api/data/${field.relationTo}`).then(
      (rows) => {
        relationOptions[field.key] = rows.map((row) => ({
          id: String(row._id),
          label: String(
            getByPath(row, field.relationLabelField ?? "name") ?? row._id
          ),
        }));
      }
    );
  }
}

function toggleMulti(key: string, id: string) {
  const list: string[] = model[key];
  model[key] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// ── Save / delete ───────────────────────────────────────────────────────────
function buildPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of props.def.fields) {
    const value = model[field.key];
    switch (field.type) {
      case "number": {
        payload[field.key] =
          value === "" || value == null
            ? field.required
              ? 0
              : undefined
            : Number(value);
        break;
      }
      case "boolean": {
        payload[field.key] = Boolean(value);
        break;
      }
      case "multiRelation": {
        payload[field.key] = value ?? [];
        break;
      }
      case "relation":
      case "media": {
        payload[field.key] = value || undefined;
        break;
      }
      case "locMedia": {
        // Missing side stays undefined; required-both fields (docs) are
        // rejected by the Convex validator, optional ones (audio) pass.
        payload[field.key] = {
          pt: value?.pt || undefined,
          en: value?.en || undefined,
        };
        break;
      }
      case "locText":
      case "locTextarea":
      case "locMarkdown": {
        payload[field.key] = { pt: value?.pt ?? "", en: value?.en ?? "" };
        break;
      }
      default: {
        payload[field.key] = value === "" ? undefined : value;
      }
    }
  }
  return payload;
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    if (props.recordId) {
      await $fetch(`/api/data/${props.collection}/${props.recordId}`, {
        body: buildPayload(),
        method: "PUT",
      });
    } else {
      await $fetch(`/api/data/${props.collection}`, {
        body: buildPayload(),
        method: "POST",
      });
    }
    toast.success("Guardado.");
    await navigateTo(`/c/${props.collection}`);
  } catch (saveError: unknown) {
    error.value = fetchErrorMessage(saveError) ?? "Erro ao guardar.";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.recordId) {
    return;
  }
  const confirmed = await confirm({
    confirmLabel: "Apagar",
    danger: true,
    description: "Esta ação é irreversível.",
    title: "Apagar este registo?",
  });
  if (!confirmed) {
    return;
  }
  await $fetch(`/api/data/${props.collection}/${props.recordId}`, {
    method: "DELETE",
  });
  toast.success("Apagado.");
  await navigateTo(`/c/${props.collection}`);
}
</script>
