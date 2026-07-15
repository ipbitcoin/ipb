<template>
  <img
    v-if="avatarKey"
    :src="url"
    alt=""
    class="shrink-0 rounded-full border object-cover"
    :class="sizeClass"
  />
  <span
    v-else
    class="flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-600"
    :class="sizeClass"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    avatarKey?: string | null;
    name: string;
    size?: "sm" | "md";
  }>(),
  { avatarKey: undefined, size: "md" }
);

const config = useRuntimeConfig();

const url = computed(() =>
  props.avatarKey ? `https://${config.public.CDN_HOST}/${props.avatarKey}` : ""
);
const sizeClass = computed(() =>
  props.size === "sm" ? "size-6 text-[10px]" : "size-9 text-xs"
);
const initials = computed(() => {
  const parts = props.name.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
});
</script>
