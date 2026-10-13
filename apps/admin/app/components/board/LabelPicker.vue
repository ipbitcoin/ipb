<template>
  <PopoverRoot v-model:open="open" :modal="false">
    <PopoverTrigger :class="triggerClass" :aria-label="label">
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="6"
        :class="POPOVER_CONTENT"
        class="flex max-h-[min(22rem,var(--reka-popover-content-available-height))] w-64 flex-col overflow-hidden"
        @click.stop
      >
        <!-- Holds the filter, to give it back focus once a label is made. -->
        <div ref="panel" class="contents">
          <ListboxRoot
            :model-value="modelValue"
            multiple
            highlight-on-hover
            class="flex min-h-0 flex-col"
            @update:model-value="change"
          >
            <ListboxFilter
              v-model="query"
              auto-focus
              aria-label="Procurar ou criar etiquetas"
              placeholder="Adicionar etiquetas…"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              :maxlength="MAX_NAME"
              class="h-10 shrink-0 border-b border-neutral-200 bg-transparent px-3 text-sm outline-none placeholder:text-neutral-400"
            />
            <ListboxContent
              v-if="matches.length > 0 || canCreate"
              class="min-h-0 overflow-y-auto overscroll-contain p-1"
            >
              <ListboxItem
                v-for="item in matches"
                :key="item._id"
                :value="item._id"
                :class="MENU_ITEM"
              >
                <span :class="MENU_CHECK">
                  <IconCheck class="size-3" />
                </span>
                <BoardLabelDot :color="item.color" />
                <span class="truncate">{{ item.name }}</span>
              </ListboxItem>
              <ListboxItem
                v-if="canCreate"
                value="__create__"
                :class="MENU_ITEM"
                @select="create"
              >
                <IconPlus class="size-4 shrink-0 text-neutral-500" />
                <span class="truncate">
                  <span class="text-neutral-500">Criar etiqueta: </span>
                  “{{ query.trim() }}”
                </span>
              </ListboxItem>
            </ListboxContent>
            <p
              v-else
              class="px-3 py-5 text-center text-sm text-balance text-neutral-500"
            >
              {{
                query.trim()
                  ? `Nenhuma etiqueta corresponde a “${query.trim()}”.`
                  : "Ainda sem etiquetas. Escreva um nome para criar uma."
              }}
            </p>
          </ListboxRoot>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import type { IdeaLabel } from "~/utils/boards";
import { MENU_CHECK, MENU_ITEM, POPOVER_CONTENT } from "~/utils/ui";

const MAX_NAME = 40;

const props = withDefaults(
  defineProps<{
    label: string;
    labels: IdeaLabel[];
    /** Ids of the labels picked. */
    modelValue: string[];
    /** Makes a label by name; resolves to its id, or nothing when it fails. */
    createLabel: (name: string) => Promise<string | undefined>;
    triggerClass?: string;
  }>(),
  { triggerClass: "" }
);

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

defineSlots<{ trigger: () => unknown }>();

const open = ref(false);
const query = ref("");
const panel = useTemplateRef<HTMLElement>("panel");

watch(open, (isOpen) => {
  if (!isOpen) {
    query.value = "";
  }
});

function key(name: string): string {
  return name.trim().toLocaleLowerCase("pt-PT");
}

/**
 * Labels whose name matches, best first: from its start, from the start of
 * a later word, or anywhere in it.
 */
const matches = computed(() => {
  const needle = key(query.value);
  if (!needle) {
    return props.labels;
  }
  return props.labels
    .flatMap((item) => {
      const name = key(item.name);
      if (name.startsWith(needle)) {
        return [{ item, rank: 0 }];
      }
      if (
        name.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(needle))
      ) {
        return [{ item, rank: 1 }];
      }
      return name.includes(needle) ? [{ item, rank: 2 }] : [];
    })
    .toSorted((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
});

const canCreate = computed(() => {
  const needle = key(query.value);
  return (
    needle !== "" && !props.labels.some((item) => key(item.name) === needle)
  );
});

/** Ids in the order the labels come, whatever order they were picked in. */
function inLabelOrder(ids: Set<string>): string[] {
  return props.labels.map((item) => item._id).filter((id) => ids.has(id));
}

function change(value: unknown) {
  const picked = Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];
  emit("update:modelValue", inLabelOrder(new Set(picked)));
}

async function create(event: Event) {
  event.preventDefault();
  const name = query.value.trim();
  if (!name) {
    return;
  }
  query.value = "";
  const id = await props.createLabel(name);
  if (id) {
    emit("update:modelValue", [...props.modelValue, id]);
  }
  // Ready for the next name, as after picking one.
  await nextTick();
  panel.value?.querySelector("input")?.focus();
}
</script>
