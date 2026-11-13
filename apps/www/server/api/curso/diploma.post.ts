import { api } from "@ipb/backend/api";

/** Issues (or renames) the diploma once every lesson is done. */
export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readBody<{ course?: string; name?: string } | undefined>(
    event
  );
  const course = body?.course ?? "";
  if (!account.courses.some((c) => c.courseSlug === course)) {
    throw createError({ message: "No access to this course", statusCode: 403 });
  }
  const lessons = await loadLessons(course);
  try {
    return await convexClient().mutation(api.courses.issueDiploma, {
      courseSlug: course,
      email: account.email,
      lessonIds: lessons.map((l) => l.id),
      name: body?.name ?? "",
      serviceKey: useRuntimeConfig().SERVICE_KEY,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not complete")) {
      throw createError({ message: "Course not complete", statusCode: 409 });
    }
    if (message.includes("Invalid name")) {
      throw createError({ message: "Invalid name", statusCode: 400 });
    }
    throw createError({
      message: "Could not issue the diploma",
      statusCode: 500,
    });
  }
});
