/**
 * Calls `refresh` whenever the admin comes back to the tab, so what changed
 * meanwhile, by another admin or by an AI app over MCP, shows up. Coming back
 * from the AI app is when that matters, and nothing is reloaded mid-drag.
 */
export function useRefreshOnReturn(refresh: () => unknown) {
  function onReturn() {
    if (document.visibilityState === "visible") {
      refresh();
    }
  }
  onMounted(() => {
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
  });
  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onReturn);
    window.removeEventListener("focus", onReturn);
  });
}
