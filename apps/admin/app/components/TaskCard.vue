<template>
  <div
    :class="
      layout === 'tile'
        ? 'flex flex-col gap-2.5 p-3'
        : 'flex h-11 items-center gap-3 px-3 text-sm'
    "
  >
    <template v-if="layout === 'tile'">
      <span
        class="line-clamp-3 text-sm leading-snug wrap-break-word text-neutral-900"
      >
        {{ task.title }}
      </span>
      <p
        v-if="task.description"
        class="-mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500"
      >
        {{ task.description }}
      </p>
    </template>

    <span
      :class="
        layout === 'tile' ? 'flex min-h-5 items-center gap-2' : 'contents'
      "
    >
      <BoardMenuSelect
        :label="`Estado: ${column?.label ?? task.status}`"
        :model-value="task.status"
        :options="statusOptions"
        :trigger-class="INLINE_TRIGGER"
        @update:model-value="(status) => status && emit('update', { status })"
      >
        <template #trigger>
          <BoardStatusIcon v-if="column" :icon="column.icon" />
        </template>
        <template #option="{ value }">
          <BoardStatusIcon
            v-if="value"
            :icon="statusIcon(TASK_COLUMNS, value)"
          />
        </template>
      </BoardMenuSelect>

      <span
        v-if="layout === 'row'"
        class="min-w-0 flex-1 truncate text-neutral-900"
      >
        {{ task.title }}
      </span>

      <BoardDatePopover
        label="Data limite"
        :model-value="task.dueDate"
        :trigger-class="dueTriggerClass"
        @update:model-value="(dueDate) => emit('update', { dueDate })"
      >
        <template #trigger>
          <span
            class="flex items-center gap-1 text-xs whitespace-nowrap tabular-nums"
            :class="overdue ? 'font-medium text-red-600' : 'text-neutral-500'"
          >
            <IconCalendar class="size-3.5" />
            <span v-if="overdue" class="sr-only">Atrasada:</span>
            <time v-if="task.dueDate" :datetime="task.dueDate">
              {{ formatDueDate(task.dueDate) }}
            </time>
          </span>
        </template>
      </BoardDatePopover>

      <BoardMenuSelect
        :label="assignee ? `Responsável: ${adminLabel(assignee)}` : 'Atribuir'"
        :model-value="task.assigneeId ?? null"
        :options="adminOptions"
        none-label="Sem responsável"
        align="end"
        :trigger-class="`${INLINE_TRIGGER} rounded-full ${layout === 'tile' ? 'ml-auto' : ''}`"
        @update:model-value="
          (id) => emit('update', { assigneeId: id ?? undefined })
        "
      >
        <template #trigger>
          <AdminAvatar
            v-if="assignee"
            :avatar-key="assignee.avatarKey"
            :name="adminLabel(assignee)"
            size="xs"
          />
          <span
            v-else
            class="flex size-5 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-400"
          >
            <IconUser class="size-3" />
          </span>
        </template>
        <template #option="{ value }">
          <AdminAvatar
            v-if="adminById(value)"
            :avatar-key="adminById(value)?.avatarKey"
            :name="adminName(value)"
            size="xs"
          />
          <IconUser v-else class="size-4 text-neutral-400" />
        </template>
      </BoardMenuSelect>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { AdminUser, TaskDoc } from "~/utils/boards";
import {
  adminLabel,
  formatDueDate,
  isOverdue,
  statusIcon,
  TASK_COLUMNS,
} from "~/utils/boards";
import { INLINE_TRIGGER } from "~/utils/ui";

const props = defineProps<{
  task: TaskDoc;
  admins: AdminUser[];
  layout: "tile" | "row";
}>();

const emit = defineEmits<{
  update: [
    changes: Partial<Pick<TaskDoc, "assigneeId" | "dueDate" | "status">>,
  ];
}>();

const statusOptions = TASK_COLUMNS.map((c) => ({
  label: c.label,
  value: c.key,
}));
function adminById(id: string | null): AdminUser | undefined {
  return id ? props.admins.find((a) => a._id === id) : undefined;
}

function adminName(id: string | null): string {
  const admin = adminById(id);
  return admin ? adminLabel(admin) : "?";
}

const adminOptions = computed(() =>
  props.admins.map((a) => ({ label: adminLabel(a), value: a._id }))
);
const column = computed(() =>
  TASK_COLUMNS.find((c) => c.key === props.task.status)
);
const assignee = computed(() => adminById(props.task.assigneeId ?? null));
const overdue = computed(() =>
  isOverdue(props.task.dueDate, column.value?.closed)
);

// Without a date, the control shows only where the pointer or focus is.
const dueTriggerClass = computed(() =>
  props.task.dueDate
    ? INLINE_TRIGGER
    : `${INLINE_TRIGGER} opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100`
);
</script>
