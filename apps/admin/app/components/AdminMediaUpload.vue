<template>
  <div class="flex flex-col gap-2">
    <div v-if="model" class="flex items-center gap-3">
      <img
        v-if="isImage"
        :src="mediaUrl"
        alt=""
        class="h-20 w-20 rounded border object-cover"
      />
      <a :href="mediaUrl" target="_blank" class="text-sm underline break-all">{{
        model
      }}</a>
      <button
        type="button"
        class="cursor-pointer text-sm text-red-600 underline"
        @click="remove"
      >
        Remover
      </button>
    </div>
    <input
      type="file"
      :accept="accept"
      class="text-sm"
      @change="onFileChange"
    />
    <span v-if="uploading" class="text-sm text-neutral-500">A carregar…</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ accept?: string }>();
const model = defineModel<string | undefined>();

const config = useRuntimeConfig();
const uploading = ref(false);

const mediaUrl = computed(() =>
  model.value ? `https://${config.public.CDN_HOST}/${model.value}` : ""
);
const isImage = computed(
  () => !props.accept || props.accept.startsWith("image")
);

async function onFileChange(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  uploading.value = true;
  const previousKey = model.value;
  try {
    // 1. signed URL  2. browser PUT  3. metadata sync
    const { url, key } = await $fetch<{ url: string; key: string }>(
      "/api/upload",
      {
        method: "POST",
      }
    );
    const putRes = await fetch(url, {
      body: file,
      headers: { "Content-Type": file.type },
      method: "PUT",
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed: ${putRes.status}`);
    }
    await $fetch("/api/upload-sync", { body: { key }, method: "POST" });
    model.value = key;
    // Delete the replaced object (best-effort)
    if (previousKey) {
      $fetch("/api/media-delete", {
        body: { key: previousKey },
        method: "POST",
      }).catch(() => {});
    }
  } finally {
    uploading.value = false;
  }
}

function remove() {
  model.value = undefined;
}
</script>
