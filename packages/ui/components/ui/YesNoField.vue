<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex gap-2">
      <button
        type="button"
        :class="[
          'px-4 py-1.5 text-sm font-semibold uppercase rounded-[3px] border transition-colors duration-150',
          modelValue === true
            ? 'bg-black text-white border-black'
            : 'bg-white text-black border-black/25 hover:border-black/60',
        ]"
        @click="toggle(true)"
      >
        {{ yesLabel }}
      </button>
      <button
        type="button"
        :class="[
          'px-4 py-1.5 text-sm font-semibold uppercase rounded-[3px] border transition-colors duration-150',
          modelValue === false
            ? 'bg-black text-white border-black'
            : 'bg-white text-black border-black/25 hover:border-black/60',
        ]"
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

// Clicking the already-selected button clears the selection (back to null)
function toggle(value: boolean) {
  emit("update:modelValue", props.modelValue === value ? null : value);
}
</script>
