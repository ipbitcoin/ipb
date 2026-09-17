<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex gap-2">
      <button
        type="button"
        :aria-pressed="modelValue === true"
        :class="[baseClass, modelValue === true ? selectedClass : idleClass]"
        @click="toggle(true)"
      >
        {{ yesLabel }}
      </button>
      <button
        type="button"
        :aria-pressed="modelValue === false"
        :class="[baseClass, modelValue === false ? selectedClass : idleClass]"
        @click="toggle(false)"
      >
        {{ noLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: boolean | null;
    yesLabel?: string;
    noLabel?: string;
  }>(),
  {
    noLabel: "Não",
    yesLabel: "Sim",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean | null): void;
}>();

const baseClass =
  "cursor-pointer rounded-[3px] border px-4 py-1.5 text-sm font-semibold uppercase transition-[background-color,color,border-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.96]";
const selectedClass = "border-black bg-black text-white";
const idleClass = "border-black/25 bg-white text-black hover:border-black/60";

// Clicking the already-selected button clears the selection (back to null)
function toggle(value: boolean) {
  emit("update:modelValue", props.modelValue === value ? null : value);
}
</script>
