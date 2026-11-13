<template>
  <!-- Development only: the whole block is removed from production builds. -->
  <div
    v-if="isDev"
    class="flex flex-col gap-2 rounded-xl border border-dashed border-black/25 p-4 text-sm"
  >
    <p class="font-mono text-[11px] tracking-wide text-neutral-500 uppercase">
      Modo desenvolvimento
    </p>
    <UiButton
      type="button"
      variant="outline"
      size="sm"
      :loading="busy"
      :disabled="busy"
      @click="unlock"
    >
      Desbloquear todos os cursos (sem pagar)
    </UiButton>
    <p v-if="done" class="text-neutral-600" role="status">
      Feito: sessão iniciada como dev@example.com.
    </p>
  </div>
</template>

<script setup lang="ts">
const isDev = import.meta.dev;
const { refresh } = useCourseAccount();
const busy = ref(false);
const done = ref(false);

async function unlock() {
  busy.value = true;
  try {
    await $fetch("/api/curso/dev-acesso", { body: {}, method: "POST" });
    await refresh();
    done.value = true;
  } finally {
    busy.value = false;
  }
}
</script>
