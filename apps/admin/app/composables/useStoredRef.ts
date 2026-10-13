/**
 * A ref remembered on this device. Reads fall back to the default when
 * storage is empty, blocked, or holds a value `accept` rejects.
 */
export function useStoredRef<T extends string>(
  key: string,
  fallback: T,
  accept: (value: string) => value is T
) {
  const value = ref<T>(fallback);

  try {
    const stored = localStorage.getItem(key);
    if (stored !== null && accept(stored)) {
      value.value = stored;
    }
  } catch {
    // Private mode or blocked storage: keep the default.
  }

  watch(value, (next) => {
    try {
      if (next === fallback) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, next);
      }
    } catch {
      // Not remembered; the choice still applies for this visit.
    }
  });

  return value;
}
