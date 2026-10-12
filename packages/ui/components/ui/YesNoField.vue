<template>
  <div class="flex flex-col gap-2" role="group" :aria-labelledby="labelId">
    <span :id="labelId" class="text-sm font-medium">{{ label }}</span>
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

const labelId = useId();

// Same pill + press language as UiButton, sized for a compact toggle pair.
const baseClass =
  "min-h-9 min-w-16 cursor-pointer rounded-full border px-4 text-sm font-medium tracking-[-0.006em] transition-[background-color,color,border-color,scale] duration-150 ease-out select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:enabled:active:scale-[0.96]";
const selectedClass = "border-neutral-950 bg-neutral-950 text-white";
const idleClass =
  "border-black/15 bg-white text-neutral-950 hover:border-black/30 hover:bg-neutral-50";

// Clicking the already-selected button clears the selection (back to null)
function toggle(value: boolean) {
  emit("update:modelValue", props.modelValue === value ? null : value);
}
</script>
