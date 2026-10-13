<template>
  <PopoverRoot v-model:open="open" :modal="false">
    <PopoverTrigger :class="triggerClass" :aria-label="label">
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :align="align"
        :side-offset="6"
        :class="POPOVER_CONTENT"
        class="flex flex-col gap-1 p-2"
        @click.stop
      >
        <CalendarRoot
          v-slot="{ weekDays, grid }"
          :model-value="date"
          :default-placeholder="date"
          locale="pt-PT"
          :week-starts-on="1"
          fixed-weeks
          prevent-deselect
          @update:model-value="pick"
        >
          <CalendarHeader class="flex items-center justify-between px-1 pb-2">
            <CalendarPrev :class="ICON_BUTTON" aria-label="Mês anterior">
              <IconChevronRight class="size-4 rotate-180" />
            </CalendarPrev>
            <CalendarHeading
              class="text-sm font-medium first-letter:uppercase"
            />
            <CalendarNext :class="ICON_BUTTON" aria-label="Mês seguinte">
              <IconChevronRight class="size-4" />
            </CalendarNext>
          </CalendarHeader>
          <CalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="border-collapse select-none"
          >
            <CalendarGridHead>
              <CalendarGridRow class="flex">
                <CalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="flex h-7 w-8 items-center justify-center text-xs font-normal text-neutral-500"
                >
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              <CalendarGridRow
                v-for="(week, index) in month.rows"
                :key="index"
                class="flex"
              >
                <CalendarCell
                  v-for="day in week"
                  :key="day.toString()"
                  :date="day"
                >
                  <CalendarCellTrigger
                    :day="day"
                    :month="month.value"
                    class="flex size-8 cursor-pointer items-center justify-center rounded-lg text-sm text-neutral-800 tabular-nums outline-none transition-colors duration-100 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand data-outside-view:text-neutral-300 data-today:font-semibold data-today:text-brand data-selected:bg-neutral-900 data-selected:text-white data-selected:hover:bg-neutral-800"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
        <button
          v-if="modelValue"
          type="button"
          class="h-8 cursor-pointer rounded-lg text-sm text-neutral-500 outline-none transition-colors duration-100 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand"
          @click="clear"
        >
          Limpar data
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

import { ICON_BUTTON, POPOVER_CONTENT } from "~/utils/ui";

const props = withDefaults(
  defineProps<{
    label: string;
    /** "YYYY-MM-DD", or nothing. */
    modelValue?: string;
    triggerClass?: string;
    align?: "start" | "center" | "end";
  }>(),
  { align: "start", modelValue: undefined, triggerClass: "" }
);

const emit = defineEmits<{
  "update:modelValue": [value?: string];
}>();

defineSlots<{ trigger: () => unknown }>();

const open = ref(false);

/** The value as a calendar date; nothing when it isn't one. */
function toDate(value?: string): DateValue | undefined {
  if (value) {
    try {
      return parseDate(value);
    } catch {
      // Not a date: the calendar starts empty.
    }
  }
}

const date = computed(() => toDate(props.modelValue));

function pick(value: DateValue | undefined) {
  open.value = false;
  emit("update:modelValue", value?.toString());
}

function clear() {
  open.value = false;
  emit("update:modelValue");
}
</script>
