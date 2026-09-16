<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl bg-white p-6 shadow-popover data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in"
      >
        <header class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <DialogTitle class="text-xl font-light">{{ title }}</DialogTitle>
            <DialogDescription
              v-if="description"
              class="text-sm text-neutral-500"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="focus-ring -mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors duration-100 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Fechar"
          >
            <IconClose class="size-5" />
          </DialogClose>
        </header>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();

const open = defineModel<boolean>("open", { default: false });
</script>
