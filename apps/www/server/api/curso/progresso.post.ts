import { api } from "@ipb/backend/api";

/** Marks a lesson done (or not done) for the signed-in learner. */
export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readBody<
    { course?: string; done?: boolean; lesson?: string } | undefined
  >(event);
  const course = body?.course ?? "";
  const lesson = body?.lesson ?? "";
  if (!account.courses.some((c) => c.courseSlug === course)) {
    throw createError({ message: "No access to this course", statusCode: 403 });
  }
  const lessons = await loadLessons(course);
  if (
    !lessons.some((l) => l.id === lesson) ||
    typeof body?.done !== "boolean"
  ) {
    throw createError({ message: "Unknown lesson", statusCode: 400 });
  }
  const result = await convexClient().mutation(api.courses.setProgress, {
    courseSlug: course,
    done: body.done,
    email: account.email,
    lesson,
    lessonIds: lessons.map((l) => l.id),
    serviceKey: useRuntimeConfig().SERVICE_KEY,
  });
  return { completed: result.completedLessons, total: lessons.length };
});
