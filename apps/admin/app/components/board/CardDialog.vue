<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
      <DialogContent
        :aria-describedby="undefined"
        class="fixed top-[12dvh] left-1/2 z-50 flex max-h-[80dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-y-auto rounded-2xl bg-white shadow-popover data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in"
        @open-auto-focus.prevent="focusTitle"
      >
        <form class="flex flex-col" @submit.prevent="submit">
          <div class="flex items-center gap-1.5 py-3 pr-3 pl-5">
            <span
              class="flex h-6 items-center rounded-md bg-neutral-950/5 px-2 text-xs font-medium text-neutral-500"
            >
              {{ board }}
            </span>
            <IconChevronRight class="size-3.5 text-neutral-400" />
            <DialogTitle class="text-sm font-medium text-neutral-900">
              {{ heading }}
            </DialogTitle>
            <DialogClose
              :class="ICON_BUTTON"
              class="ml-auto"
              aria-label="Fechar"
            >
              <IconClose class="size-4" />
            </DialogClose>
          </div>

          <div class="flex flex-col gap-1 px-5">
            <textarea
              ref="titleField"
              v-model="title"
              aria-label="Título"
              :placeholder="titlePlaceholder"
              rows="1"
              required
              class="field-sizing-content resize-none bg-transparent text-lg leading-snug font-semibold text-neutral-950 outline-none placeholder:text-neutral-400"
              @keydown.enter.exact.prevent="submit"
            />
            <textarea
              v-model="description"
              aria-label="Descrição"
              placeholder="Adicionar descrição…"
              rows="3"
              class="field-sizing-content max-h-[40dvh] min-h-20 resize-none bg-transparent text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400"
              @keydown.meta.enter.prevent="submit"
              @keydown.ctrl.enter.prevent="submit"
            />
          </div>

          <div class="flex flex-wrap items-center gap-1.5 px-5 pt-2 pb-4">
            <slot name="properties" />
          </div>

          <p
            v-if="error"
            class="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </p>

          <div
            class="flex items-center gap-4 border-t border-neutral-100 px-5 py-3"
          >
            <button
              v-if="editing"
              type="button"
              class="-ml-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm text-neutral-500 outline-none transition-colors duration-150 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-brand"
              @click="emit('remove')"
            >
              <IconTrash class="size-4" />
              Apagar
            </button>
            <label
              v-else
              class="flex cursor-pointer items-center gap-2 text-sm text-neutral-500 select-none"
            >
              <SwitchRoot
                v-model="createMore"
                class="relative flex h-5 w-8.5 shrink-0 cursor-pointer items-center rounded-full bg-neutral-200 p-0.5 outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[state=checked]:bg-neutral-900"
              >
                <SwitchThumb
                  class="size-4 rounded-full bg-white shadow-sm transition-[translate] duration-150 ease-out data-[state=checked]:translate-x-3.5"
                />
              </SwitchRoot>
              Criar mais
            </label>
            <UiButton
              type="submit"
              size="sm"
              class="ml-auto"
              :loading="saving"
              :disabled="!title.trim()"
            >
              {{ editing ? "Guardar" : submitLabel }}
            </UiButton>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ICON_BUTTON } from "~/utils/ui";

withDefaults(
  defineProps<{
    /** The board the card belongs to, shown before the heading. */
    board: string;
    heading: string;
    titlePlaceholder: string;
    submitLabel: string;
    editing?: boolean;
    saving?: boolean;
    error?: string;
  }>(),
  { editing: false, error: "", saving: false }
);

const open = defineModel<boolean>("open", { default: false });
const title = defineModel<string>("title", { required: true });
const description = defineModel<string>("description", { required: true });
const createMore = defineModel<boolean>("createMore", { default: false });

const emit = defineEmits<{ submit: []; remove: [] }>();

defineSlots<{ properties: () => unknown }>();

const titleField = useTemplateRef<HTMLTextAreaElement>("titleField");

function focusTitle() {
  const field = titleField.value;
  field?.focus();
  // An opened card picks up at the end of its title.
  field?.setSelectionRange(field.value.length, field.value.length);
}

function submit() {
  if (title.value.trim()) {
    emit("submit");
  }
}

defineExpose({ focusTitle });
</script>
