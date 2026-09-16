<template>
  <div class="flex flex-col gap-3">
    <div v-if="model" class="flex items-center gap-3">
      <img
        v-if="isImage"
        :src="mediaUrl"
        alt=""
        class="size-20 shrink-0 rounded-lg object-cover outline -outline-offset-1 outline-black/10"
      />
      <div class="flex min-w-0 flex-col gap-1">
        <a
          :href="mediaUrl"
          target="_blank"
          class="focus-ring truncate rounded text-sm text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors duration-100 hover:decoration-neutral-700"
        >
          {{ model }}
        </a>
        <button
          type="button"
          class="focus-ring w-fit cursor-pointer rounded text-sm text-red-600 transition-colors duration-100 hover:text-red-700 hover:underline"
          @click="remove"
        >
          Remover
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <label
        class="inline-flex cursor-pointer items-center rounded-[3px] border border-[#C2C2C2] bg-white px-4 py-1.5 text-sm font-semibold uppercase transition-colors duration-150 ease-out hover:bg-[#f8f8f8] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
        :class="{ 'pointer-events-none opacity-50': uploading }"
      >
        {{ model ? "Substituir" : "Escolher ficheiro" }}
        <input
          type="file"
          :accept="accept"
          class="sr-only"
          :disabled="uploading"
          @change="onFileChange"
        />
      </label>
      <span v-if="uploading" class="text-sm text-neutral-500">A carregar…</span>
    </div>
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
    // Allow re-selecting the same file
    input.value = "";
  }
}

function remove() {
  model.value = undefined;
}
</script>
