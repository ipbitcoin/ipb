/**
 * The signed-in learner (cookie) and the courses they own, with progress.
 * Loaded on the client only: the pages stay the same for everybody on the
 * server, so they can be cached, and fill in the personal parts afterwards.
 */
export default function useCourseAccount() {
  const { data, refresh, status } = useFetch<CourseAccountData>(
    "/api/curso/conta",
    {
      default: () => ({ courses: [], email: null }),
      key: "course-account",
      lazy: true,
      server: false,
    }
  );

  const account = computed(() => data.value ?? { courses: [], email: null });
  const pending = computed(() => status.value === "pending");

  function progressOf(slug: string): CourseProgress | undefined {
    return account.value.courses.find((c) => c.slug === slug);
  }

  async function signOut() {
    await $fetch("/api/curso/sair", { method: "POST" });
    await refresh();
  }

  return { account, pending, progressOf, refresh, signOut };
}
