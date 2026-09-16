/** Promise-based confirm dialog. Rendered once by `AdminConfirmHost` in app.vue. */

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm action as destructive. */
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

export const confirmState = reactive<ConfirmState>({
  open: false,
  options: { title: "" },
  resolve: null,
});

function settle(value: boolean) {
  confirmState.open = false;
  confirmState.resolve?.(value);
  confirmState.resolve = null;
}

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // A second call while one is pending cancels the first.
    confirmState.resolve?.(false);
    confirmState.options = options;
    confirmState.open = true;
    const { promise, resolve } = Promise.withResolvers<boolean>();
    confirmState.resolve = resolve;
    return promise;
  }

  return { cancel: () => settle(false), confirm, accept: () => settle(true) };
}
