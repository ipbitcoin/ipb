import { findCourse } from "@ipb/backend/courseCatalog";

/** Public: the lesson titles of a course (no lesson content). */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "curso") ?? "";
  if (!findCourse(slug)) {
    throw createError({ message: "Course not found", statusCode: 404 });
  }
  setHeader(event, "Cache-Control", "public, max-age=300");
  return { lessons: await loadLessons(slug) };
});
