<template>
  <ToggleGroupRoot
    v-if="admins.length > 1"
    :model-value="modelValue ?? ''"
    type="single"
    aria-label="Filtrar por responsável"
    class="group/filter flex shrink-0 -space-x-1"
    @update:model-value="pick"
  >
    <ToggleGroupItem
      v-for="admin in admins"
      :key="admin._id"
      :value="admin._id"
      :aria-label="adminLabel(admin)"
      :title="adminLabel(admin)"
      class="relative cursor-pointer rounded-full ring-2 ring-neutral-50 outline-none transition-[opacity,box-shadow] duration-150 group-has-[[data-state=on]]/filter:opacity-50 hover:z-10 hover:opacity-100 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[state=on]:z-10 data-[state=on]:opacity-100! data-[state=on]:ring-brand"
    >
      <AdminAvatar
        :avatar-key="admin.avatarKey"
        :name="adminLabel(admin)"
        size="sm"
      />
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
import type { AdminUser } from "~/utils/boards";
import { adminLabel } from "~/utils/boards";

defineProps<{ admins: AdminUser[] }>();

const modelValue = defineModel<string | undefined>();

function pick(value: unknown) {
  modelValue.value = typeof value === "string" && value ? value : undefined;
}
</script>
