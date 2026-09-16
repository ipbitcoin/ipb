<template>
  <AlertDialogRoot :open="confirmState.open" @update:open="onOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-60 bg-black/30 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
      <!-- z-60: must sit above an editor Dialog that opened it -->
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 z-60 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-xl bg-white p-6 shadow-popover data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in"
      >
        <div class="flex flex-col gap-1">
          <AlertDialogTitle class="text-xl font-light">
            {{ confirmState.options.title }}
          </AlertDialogTitle>
          <AlertDialogDescription
            v-if="confirmState.options.description"
            class="text-sm text-neutral-500"
          >
            {{ confirmState.options.description }}
          </AlertDialogDescription>
        </div>
        <div class="flex items-center justify-end gap-3">
          <AlertDialogCancel as-child>
            <UiButton type="button" variant="outline" @click="cancel">
              {{ confirmState.options.cancelLabel ?? "Cancelar" }}
            </UiButton>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <UiButton
              type="button"
              :variant="confirmState.options.danger ? 'danger' : 'primary'"
              @click="accept"
            >
              {{ confirmState.options.confirmLabel ?? "Confirmar" }}
            </UiButton>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { confirmState, useConfirm } from "~/composables/useConfirm";

const { accept, cancel } = useConfirm();

// Escape / outside interaction closes → treat as cancel.
function onOpenChange(isOpen: boolean) {
  if (!isOpen) {
    cancel();
  }
}
</script>
