<template>
  <DropdownMenuRoot :modal="false">
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
        <template v-for="group in groups" :key="group.label ?? 'options'">
          <DropdownMenuLabel v-if="group.label" :class="MENU_LABEL">
            {{ group.label }}
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            v-for="option in group.options"
            :key="option.value"
            :model-value="modelValue.includes(option.value)"
            :class="MENU_ITEM"
            @select.prevent
            @update:model-value="(on) => toggle(option.value, on)"
          >
            <span :class="MENU_CHECK">
              <IconCheck class="size-3" />
            </span>
            <slot name="option" :value="option.value" />
            <span class="truncate">{{ option.label }}</span>
          </DropdownMenuCheckboxItem>
        </template>
        <p
          v-if="groups.every((group) => group.options.length === 0)"
          class="px-2 py-4 text-center text-sm text-neutral-500"
        >
          {{ emptyLabel }}
        </p>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { MENU_CHECK, MENU_CONTENT, MENU_ITEM, MENU_LABEL } from "~/utils/ui";

interface Option {
  value: string;
  label: string;
}

interface OptionGroup {
  label?: string;
  options: Option[];
}

const props = withDefaults(
  defineProps<{
    label: string;
    groups: OptionGroup[];
    modelValue: string[];
    triggerClass?: string;
    align?: "start" | "center" | "end";
    emptyLabel?: string;
  }>(),
  { align: "start", emptyLabel: "Sem opções.", triggerClass: "" }
);

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

defineSlots<{
  trigger: () => unknown;
  option: (props: { value: string }) => unknown;
}>();

// Kept in the order the options come, whatever order they were picked in.
function toggle(value: string, on: boolean) {
  const picked = new Set(props.modelValue);
  if (on) {
    picked.add(value);
  } else {
    picked.delete(value);
  }
  emit(
    "update:modelValue",
    props.groups
      .flatMap((group) => group.options)
      .map((option) => option.value)
      .filter((item) => picked.has(item))
  );
}
</script>
