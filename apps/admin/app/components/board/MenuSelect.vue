<template>
  <DropdownMenuRoot v-model:open="open" :modal="false">
    <DropdownMenuTrigger :class="triggerClass" :aria-label="label">
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="6"
        :class="MENU_CONTENT"
        @click.stop
      >
        <DropdownMenuRadioGroup
          :model-value="modelValue ?? NONE"
          @update:model-value="pick"
        >
          <DropdownMenuRadioItem
            v-for="option in choices"
            :key="option.value"
            :value="option.value"
            :class="MENU_ITEM"
          >
            <slot
              name="option"
              :value="option.value === NONE ? null : option.value"
            />
            <span class="flex-1 truncate">{{ option.label }}</span>
            <DropdownMenuItemIndicator class="text-neutral-900">
              <IconCheck class="size-4" />
            </DropdownMenuItemIndicator>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { MENU_CONTENT, MENU_ITEM } from "~/utils/ui";

interface Option {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: Option[];
    modelValue: string | null;
    /** Offered first, for picking nothing. */
    noneLabel?: string;
    triggerClass?: string;
    align?: "start" | "center" | "end";
  }>(),
  { align: "start", noneLabel: undefined, triggerClass: "" }
);

const emit = defineEmits<{ "update:modelValue": [value: string | null] }>();

defineSlots<{
  trigger: () => unknown;
  option: (props: { value: string | null }) => unknown;
}>();

const open = ref(false);

// Radio values are strings, so "nothing" needs one of its own.
const NONE = "__none__";

const choices = computed(() =>
  props.noneLabel
    ? [{ label: props.noneLabel, value: NONE }, ...props.options]
    : props.options
);

function pick(value: unknown) {
  if (typeof value !== "string") {
    return;
  }
  const next = value === NONE ? null : value;
  if (next !== props.modelValue) {
    emit("update:modelValue", next);
  }
}
</script>
