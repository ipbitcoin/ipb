/**
 * Tracks the user's reduced-motion preference.
 * False during SSR and until mounted, so markup is stable on hydration.
 */
export default function useReducedMotion() {
  const reduced = ref(false);

  onMounted(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.value = query.matches;

    const onChange = (event: MediaQueryListEvent) => {
      reduced.value = event.matches;
    };
    query.addEventListener("change", onChange);
    onBeforeUnmount(() => query.removeEventListener("change", onChange));
  });

  return reduced;
}
